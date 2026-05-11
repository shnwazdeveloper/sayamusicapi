import type { ApiContext } from "../http";
import { fetchJson, limit, requiredParam, requiredQuery, yes } from "../http";

const AUDIUS_BASE = "https://api.audius.co/v1";

function audiusHeaders(c: ApiContext) {
  const headers = new Headers();
  if (c.env?.AUDIUS_API_KEY) {
    headers.set("Authorization", `Bearer ${c.env.AUDIUS_API_KEY}`);
  }
  return headers;
}

export async function audiusGet(
  c: ApiContext,
  path: string,
  params: Record<string, string> = {}
) {
  const url = new URL(path, AUDIUS_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return fetchJson(c, url, {
    headers: audiusHeaders(c),
    cf: { cacheTtl: 300, cacheEverything: true }
  });
}

export async function audiusSearch(
  c: ApiContext,
  resource: "tracks" | "users" | "playlists",
  query?: string
) {
  return audiusGet(c, `/${resource}/search`, {
    query: query || requiredQuery(c),
    limit: `${limit(c, 100, 100)}`
  });
}

export async function audiusTrack(c: ApiContext) {
  return audiusGet(c, `/tracks/${requiredParam(c, "id")}`);
}

export async function audiusTrackStream(c: ApiContext, trackId?: string) {
  const id = trackId || requiredParam(c, "id");
  const url = new URL(`/tracks/${id}/stream`, AUDIUS_BASE);
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: audiusHeaders(c),
      redirect: "manual",
      cf: { cacheTtl: 300, cacheEverything: true }
    } as RequestInit & { cf?: unknown });
  } catch (error) {
    return {
      id,
      upstreamOk: false,
      endpointAlive: true,
      streamUrl: null,
      message: "Endpoint is alive, but Audius stream lookup could not be completed.",
      details: error instanceof Error ? error.message : "Network request failed"
    };
  }

  const location = response.headers.get("Location");
  if (location) {
    return {
      id,
      streamUrl: location,
      canRedirect: yes(c, "redirect")
    };
  }

  if (!response.ok) {
    return {
      id,
      upstreamOk: false,
      endpointAlive: true,
      status: response.status,
      statusText: response.statusText,
      streamUrl: null,
      message: `Endpoint is alive, but Audius stream lookup returned ${response.status} ${response.statusText}.`,
      details: await response.text()
    };
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return {
      id,
      data: await response.json(),
      canRedirect: false
    };
  }

  return {
    id,
    streamUrl: url.toString(),
    canRedirect: yes(c, "redirect")
  };
}

export async function audiusTrending(
  c: ApiContext,
  resource: "tracks" | "playlists"
) {
  return audiusGet(c, `/${resource}/trending`, {
    limit: `${limit(c, 100, 100)}`,
    genre: c.req.query("genre") || "",
    time: c.req.query("time") || ""
  });
}

export async function audiusUserTracks(c: ApiContext) {
  return audiusGet(c, `/users/${requiredParam(c, "id")}/tracks`, {
    limit: `${limit(c, 100, 100)}`
  });
}

export async function audiusPlaylistTracks(c: ApiContext) {
  return audiusGet(c, `/playlists/${requiredParam(c, "id")}/tracks`, {
    limit: `${limit(c, 100, 100)}`
  });
}

export function normalizeAudiusTracks(data: unknown) {
  const tracks =
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
      ? (data as { data: Array<Record<string, any>> }).data
      : [];

  return tracks.map((item) => ({
    source: "audius",
    id: item.id,
    type: "track",
    title: item.title,
    artist: item.user?.name || item.user?.handle,
    duration: item.duration,
    genre: item.genre,
    artworkUrl: item.artwork?.["480x480"] || item.artwork?.["150x150"],
    streamable: item.is_streamable,
    downloadable: item.is_downloadable
  }));
}
