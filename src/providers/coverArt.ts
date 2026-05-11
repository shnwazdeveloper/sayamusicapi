import type { ApiContext } from "../http";
import { encodedPath, fetchJson, requiredParam } from "../http";

const COVER_BASE = "https://coverartarchive.org";

export function coverArtUrl(scope: "release" | "release-group", id: string) {
  return new URL(`/${scope}/${encodedPath(id)}`, COVER_BASE);
}

export async function coverArtJson(
  c: ApiContext,
  scope: "release" | "release-group",
  id = requiredParam(c, "id")
) {
  return fetchJson(c, coverArtUrl(scope, id), {
    cf: { cacheTtl: 86400, cacheEverything: true }
  });
}

export function coverArtImageUrl(
  scope: "release" | "release-group",
  id: string,
  kind: "front" | "back",
  size?: string
) {
  const suffix = size ? `${kind}-${size}` : kind;
  return new URL(`/${scope}/${encodedPath(id)}/${suffix}`, COVER_BASE);
}

export function coverArtFileUrl(id: string, file: string) {
  return new URL(`/release/${encodedPath(id)}/${encodedPath(file)}`, COVER_BASE);
}

export async function coverArtLookup(c: ApiContext) {
  const release = c.req.query("release");
  const releaseGroup = c.req.query("releaseGroup") || c.req.query("release_group");
  if (release) {
    return coverArtJson(c, "release", release);
  }
  if (releaseGroup) {
    return coverArtJson(c, "release-group", releaseGroup);
  }
  return {
    message: "Provide ?release=<mbid> or ?releaseGroup=<mbid>."
  };
}

