import app from "../src/index";
import { endpointCount, endpoints, type EndpointDoc } from "../src/endpoints";

declare const process: {
  argv: string[];
  exitCode?: number;
};

type HonoRoute = {
  method: string;
  path: string;
};

type AuditResult = {
  endpoint: EndpointDoc;
  matchedRoute?: string;
  smokeUrl: string;
  status?: number;
  smokeOk?: boolean;
  ok: boolean;
  reason?: string;
};

const args = new Set(process.argv.slice(2));
const shouldSmoke = args.has("--smoke");
const smokeLimit = Number(
  [...args]
    .find((arg) => arg.startsWith("--limit="))
    ?.split("=")
    .at(1) || endpointCount
);
const concurrency = Number(
  [...args]
    .find((arg) => arg.startsWith("--concurrency="))
    ?.split("=")
    .at(1) || 8
);
const timeoutMs = Number(
  [...args]
    .find((arg) => arg.startsWith("--timeout="))
    ?.split("=")
    .at(1) || 15000
);

const routes = ((app as unknown as { routes?: HonoRoute[] }).routes || [])
  .filter((route) => route.method === "GET" && route.path !== "/*")
  .map((route) => route.path);

const sampleParams: Record<string, string> = {
  id: "1",
  upc: "602527559520",
  isbn: "9780143127741",
  isrc: "USUM71703861",
  identifier: "opensource_audio",
  file: "opensource_audio_meta.xml",
  uuid: "960feddb-0601-11e8-ae97-52543be04c81",
  ids: "Q638",
  title: "Music",
  mbid: "a74b1b7f-71a5-4011-9441-d0b5e4122711",
  owner: "shnwazdeveloper",
  repo: "sayamusicapi",
  size: "250"
};

function segmentize(path: string) {
  return path.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
}

function matchesRoute(routePattern: string, endpointPath: string) {
  const routeSegments = segmentize(routePattern);
  const endpointSegments = segmentize(endpointPath);
  if (routeSegments.length !== endpointSegments.length) {
    return false;
  }

  return routeSegments.every((segment, index) => {
    const endpointSegment = endpointSegments[index];
    return segment.startsWith(":") || segment === endpointSegment;
  });
}

function matchedRoute(path: string) {
  return routes.find((route) => matchesRoute(route, path));
}

function sampleParam(name: string, endpoint: EndpointDoc) {
  if (name === "id") {
    if (endpoint.path.includes("/apple/")) return "1440839810";
    if (endpoint.path.includes("/deezer/")) return "3135556";
    if (endpoint.path.includes("/openverse/audio/")) return "0e6d1b2f-bd50-4a9a-83f8-8f51d8bc06d1";
    if (endpoint.path.includes("/openverse/images/")) return "c9e7ea42-72e5-4f29-a596-6b4f0d1857dc5";
    if (endpoint.path.includes("/cover-art/")) return "59211ea4-ffd2-4ad9-9a4e-941d3148024a";
    if (endpoint.path.includes("/musicbrainz/artists/")) return sampleParams.mbid;
    if (endpoint.path.includes("/musicbrainz/")) return "cc197bad-dc9c-440d-a5b5-d52ba2e14234";
    if (endpoint.path.includes("/wikidata/")) return "Q638";
    if (endpoint.path.includes("/audius/")) return "D7KyD";
  }
  return sampleParams[name] || "music";
}

function smokeUrl(endpoint: EndpointDoc) {
  let path = endpoint.path.replace(/:([A-Za-z0-9_-]+)/g, (_, name: string) =>
    encodeURIComponent(sampleParam(name, endpoint))
  );
  const url = new URL(path, "http://local.test");

  for (const key of endpoint.query || []) {
    if (url.searchParams.has(key) || ["id", "owner", "repo", "identifier", "file", "uuid", "ids", "mbid"].includes(key)) {
      continue;
    }

    const values: Record<string, string> = {
      q: "believer",
      limit: "1",
      country: "US",
      offset: "0",
      page: "1",
      inc: "",
      range: "week",
      artist_name: "Imagine Dragons",
      recording_name: "Believer",
      release_name: "Evolve",
      artist: "Imagine Dragons",
      title: "Believer",
      source: "archive",
      provider: "apple",
      release: "59211ea4-ffd2-4ad9-9a4e-941d3148024a",
      releaseGroup: "b1392450-e666-3926-a536-22c65f834433",
      url: "https://music.apple.com/us/album/believer/1411625594?i=1411625601",
      userCountry: "US",
      sort: "stars"
    };

    const value = values[key];
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  if (endpoint.path === "/v1/media/stream") {
    url.searchParams.set("source", "archive");
    url.searchParams.set("identifier", "opensource_audio");
  }
  if (endpoint.path === "/v1/media/download") {
    url.searchParams.set("source", "archive");
    url.searchParams.set("identifier", "opensource_audio");
  }
  if (endpoint.path === "/v1/media/artwork") {
    url.searchParams.set("provider", "apple");
    url.searchParams.set("id", "1440839810");
  }
  if (endpoint.path === "/v1/match") {
    url.searchParams.set("artist", "Imagine Dragons");
    url.searchParams.set("title", "Believer");
  }
  if (endpoint.path === "/v1/resolve") {
    url.searchParams.set("url", "https://music.apple.com/us/album/believer/1411625594?i=1411625601");
  }

  path = `${url.pathname}${url.search}`;
  return path;
}

async function smoke(endpoint: EndpointDoc, path: string): Promise<Pick<AuditResult, "status" | "reason">> {
  const response = await Promise.race([
    app.request(path),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Smoke timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
  if (response.status === 404) {
    let body: any;
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    if (body?.error?.message === "Endpoint not found") {
      return { status: response.status, reason: "dead route: endpoint not found" };
    }
  }
  if (response.status >= 500) {
    return { status: response.status, reason: "server error" };
  }
  return { status: response.status };
}

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>
) {
  let index = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current], current);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const results: AuditResult[] = [];
  for (const endpoint of endpoints) {
    const route = matchedRoute(endpoint.path);
    const url = smokeUrl(endpoint);
    results.push({
      endpoint,
      matchedRoute: route,
      smokeUrl: url,
      ok: Boolean(route),
      reason: route ? undefined : "no registered route matches this documented endpoint"
    });
  }

  if (shouldSmoke) {
    const smokeTargets = results.slice(0, smokeLimit);
    await runWithConcurrency(smokeTargets, async (result) => {
      if (!result.ok) return;
      try {
        const smokeResult = await smoke(result.endpoint, result.smokeUrl);
        result.status = smokeResult.status;
        result.smokeOk = smokeResult.status !== undefined && smokeResult.status < 400;
        if (smokeResult.reason) {
          result.reason = smokeResult.reason;
        }
      } catch (error) {
        result.smokeOk = false;
        result.reason = error instanceof Error ? error.message : "smoke request failed";
      }
    });
  }

  const failed = results.filter((result) => !result.ok);
  const smoked = results.filter((result) => result.status !== undefined || result.smokeOk === false);
  const smokeWorking = smoked.filter((result) => result.smokeOk).length;
  const smokeClientErrors = smoked.filter((result) => result.status && result.status >= 400 && result.status < 500);
  const smokeServerErrors = smoked.filter((result) => result.status && result.status >= 500);
  const smokeTimeouts = smoked.filter((result) => result.reason?.includes("Smoke timeout"));
  const routeDeadDuringSmoke = smoked.filter((result) => result.reason === "dead route: endpoint not found");
  const summary = {
    documented: endpointCount,
    registeredGetRoutes: routes.length,
    checked: results.length,
    routeWorking: results.length - failed.length,
    routeDead: failed.length,
    smokeChecked: smoked.length,
    smokeWorking,
    smokeNotWorking: smoked.length - smokeWorking,
    smoke4xx: smokeClientErrors.length,
    smoke5xx: smokeServerErrors.length,
    smokeTimeouts: smokeTimeouts.length,
    routeDeadDuringSmoke: routeDeadDuringSmoke.length
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failed.length) {
    console.log("\nDead/not working endpoints:");
    for (const result of failed.slice(0, 50)) {
      console.log(
        `${result.endpoint.method} ${result.endpoint.path} -> ${result.reason || "failed"}`
      );
    }
    process.exitCode = 1;
  }

  if (shouldSmoke) {
    const smokeFailures = smoked.filter((result) => !result.smokeOk);
    if (smokeFailures.length) {
      console.log("\nSmoke not working sample:");
      for (const result of smokeFailures.slice(0, 50)) {
        console.log(
          `${result.status || "TIMEOUT"} ${result.endpoint.path} -> ${result.smokeUrl} (${result.reason || "HTTP not OK"})`
        );
      }
    }

    if (smokeServerErrors.length || routeDeadDuringSmoke.length) {
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
