import type { Context } from "hono";
import type { ApiBindings, ApiMeta } from "./types";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type FetchInitWithCf = RequestInit & {
  cf?: {
    cacheTtl?: number;
    cacheEverything?: boolean;
  };
};

export type ApiContext = Context<ApiBindings>;

export const USER_AGENT =
  "SayamusicAPI/0.1.0 (https://github.com/shnwazdeveloper/sayamusicapi)";

export function apiName(c: ApiContext) {
  return c.env?.API_NAME || "SayaMusicAPI";
}

export function defaultCountry(c: ApiContext) {
  return (c.req.query("country") || c.env?.DEFAULT_COUNTRY || "US").toUpperCase();
}

export function cacheTtl(c: ApiContext, fallback = 900) {
  const raw = c.req.query("ttl") || c.env?.CACHE_TTL_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : fallback;
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(parsed, 86400);
}

export function requestedLimit(c: ApiContext) {
  const raw = c.req.query("limit")?.trim();
  if (!raw || raw.toLowerCase() === "all" || raw === "0") {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return undefined;
  }
  return `${parsed}`;
}

export function applyLimit(c: ApiContext, url: URL, key = "limit") {
  const value = requestedLimit(c);
  if (value) {
    url.searchParams.set(key, value);
  }
}

export function offset(c: ApiContext, fallback = 0, max = 5000) {
  const parsed = Number.parseInt(c.req.query("offset") || `${fallback}`, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export function page(c: ApiContext, fallback = 1, max = 1000) {
  const parsed = Number.parseInt(c.req.query("page") || `${fallback}`, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export function requiredQuery(c: ApiContext, key = "q") {
  const value = c.req.query(key)?.trim();
  if (!value) {
    throw new ApiError(400, `Missing required query parameter: ${key}`);
  }
  return value;
}

export function requiredParam(c: ApiContext, key: string) {
  const value = c.req.param(key)?.trim();
  if (!value) {
    throw new ApiError(400, `Missing required path parameter: ${key}`);
  }
  return value;
}

export function yes(c: ApiContext, key: string, fallback = false) {
  const value = c.req.query(key);
  if (value === undefined) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export async function jsonOk(c: ApiContext, data: unknown, meta: ApiMeta = {}) {
  const status = Number(meta.status || 200);
  const safeMeta = { ...meta };
  delete safeMeta.status;
  const resolved = await data;
  c.header("Cache-Control", `public, max-age=${cacheTtl(c)}`);
  return c.json(
    {
      ok: true,
      service: apiName(c),
      ...safeMeta,
      data: resolved
    },
    status as 200
  );
}

export function jsonError(c: ApiContext, error: unknown) {
  const status = error instanceof ApiError ? error.status : 500;
  const message =
    error instanceof Error ? error.message : "Unexpected API error";
  const details = error instanceof ApiError ? error.details : undefined;

  return c.json(
    {
      ok: false,
      service: apiName(c),
      error: {
        message,
        details
      }
    },
    status as 400
  );
}

export async function fetchJson<T>(
  c: ApiContext,
  url: URL,
  init: FetchInitWithCf = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", headers.get("Accept") || "application/json");
  headers.set("User-Agent", headers.get("User-Agent") || USER_AGENT);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...init,
      headers,
      cf: {
        cacheEverything: true,
        cacheTtl: cacheTtl(c),
        ...init.cf
      }
    } as FetchInitWithCf);
  } catch (error) {
    return {
      upstreamOk: false,
      endpointAlive: true,
      url: url.toString(),
      message: "Endpoint is alive, but the upstream provider request could not be completed.",
      details: error instanceof Error ? error.message : "Network request failed"
    } as T;
  }

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.text();
    } catch {
      details = response.statusText;
    }
    return {
      upstreamOk: false,
      endpointAlive: true,
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
      message: `Endpoint is alive, but the upstream provider returned ${response.status} ${response.statusText}.`,
      details
    } as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return {
      upstreamOk: true,
      endpointAlive: true,
      url: url.toString(),
      message: "Upstream provider returned a non-JSON success response.",
      contentType: response.headers.get("Content-Type"),
      text: await response.text()
    } as T;
  }
}

export function encodedPath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

export function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== "")
  ) as Partial<T>;
}

export async function settledRecord<T>(
  entries: Array<[string, Promise<T>]>
): Promise<Record<string, T | { error: string }>> {
  const settled = await Promise.allSettled(entries.map(([, task]) => task));
  return Object.fromEntries(
    entries.map(([name], index) => {
      const result = settled[index];
      if (result.status === "fulfilled") {
        return [name, result.value];
      }
      const reason =
        result.reason instanceof Error ? result.reason.message : "Provider failed";
      return [name, { error: reason }];
    })
  );
}
