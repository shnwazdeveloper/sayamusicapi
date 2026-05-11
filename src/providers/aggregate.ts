import type { ApiContext } from "../http";
import { ApiError, requiredQuery, settledRecord, yes } from "../http";
import {
  appleLookupById,
  applePreview,
  appleSearch,
  normalizeAppleResults
} from "./apple";
import { archivePlayable, archiveSearch } from "./archive";
import { audiusSearch, audiusTrackStream, normalizeAudiusTracks } from "./audius";
import { coverArtJson } from "./coverArt";
import { mbSearch, normalizeMbRecordings } from "./musicbrainz";

type AggregateType =
  | "tracks"
  | "albums"
  | "artists"
  | "music-videos"
  | "podcasts"
  | "audiobooks";

const appleType: Record<AggregateType, { media?: string; entity?: string }> = {
  tracks: { media: "music", entity: "song" },
  albums: { media: "music", entity: "album" },
  artists: { media: "music", entity: "musicArtist" },
  "music-videos": { entity: "musicVideo" },
  podcasts: { media: "podcast", entity: "podcast" },
  audiobooks: { media: "audiobook", entity: "audiobook" }
};

const mbType: Partial<Record<AggregateType, string>> = {
  tracks: "recordings",
  albums: "releases",
  artists: "artists"
};

export async function aggregateSearch(c: ApiContext, type: AggregateType = "tracks") {
  requiredQuery(c);
  const providers = new Set(
    (c.req.query("providers") || "apple,musicbrainz,audius,archive")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

  const tasks: Array<[string, Promise<unknown>]> = [];
  if (providers.has("apple")) {
    tasks.push(["apple", appleSearch(c, appleType[type])]);
  }
  if (providers.has("musicbrainz") && mbType[type]) {
    tasks.push(["musicbrainz", mbSearch(c, mbType[type]!)]);
  }
  if (providers.has("audius") && type === "tracks") {
    tasks.push(["audius", audiusSearch(c, "tracks")]);
  }
  if (providers.has("archive") && type === "tracks" && yes(c, "includeArchive")) {
    tasks.push(["archive", archiveSearch(c, "audio")]);
  }

  const sources = await settledRecord(tasks);
  const merged = [
    ...normalizeAppleResults(sources.apple),
    ...normalizeMbRecordings(sources.musicbrainz),
    ...normalizeAudiusTracks(sources.audius)
  ];

  return {
    query: c.req.query("q"),
    type,
    sources,
    merged
  };
}

export async function discover(c: ApiContext) {
  const provider = c.req.query("provider") || "audius";
  if (provider === "audius") {
    return {
      provider,
      hint: "Use /v1/audius/trending/tracks?genre=Electronic&time=week"
    };
  }
  if (provider === "archive") {
    return archiveSearch(c, "music");
  }
  return aggregateSearch(c, "tracks");
}

export async function autocomplete(c: ApiContext) {
  requiredQuery(c);
  const data = await appleSearch(c, { media: "music", entity: "song" });
  return normalizeAppleResults(data)
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      label: [item.title, item.artist].filter(Boolean).join(" - "),
      source: item.source
    }));
}

export async function matchSong(c: ApiContext) {
  const artist = c.req.query("artist")?.trim();
  const title = c.req.query("title")?.trim();
  if (!artist || !title) {
    throw new ApiError(400, "Provide both ?artist= and ?title=.");
  }

  const query = `${artist} ${title}`;
  const sources = await settledRecord([
    ["apple", appleSearch(c, { media: "music", entity: "song", term: query })],
    ["musicbrainz", mbSearch(c, "recordings", query)],
    ["audius", audiusSearch(c, "tracks", query)]
  ]);

  return {
    query,
    type: "tracks",
    sources,
    merged: [
      ...normalizeAppleResults(sources.apple),
      ...normalizeMbRecordings(sources.musicbrainz),
      ...normalizeAudiusTracks(sources.audius)
    ]
  };
}

export async function resolveUrl(c: ApiContext) {
  const url = c.req.query("url")?.trim();
  if (!url) {
    throw new ApiError(400, "Provide ?url=<provider-url>.");
  }
  return {
    url,
    message:
      "Provider URL resolving is intentionally conservative. Use provider IDs for exact stream, preview, artwork, and metadata lookup."
  };
}

export async function mediaPreview(c: ApiContext) {
  const id = c.req.query("id");
  if (id) {
    return applePreview(c, id);
  }
  const data = await aggregateSearch(c, "tracks");
  const preview = data.merged.find((item: any) => item.previewUrl);
  return preview || { previewUrl: null, message: "No legal preview was found." };
}

export async function mediaStream(c: ApiContext) {
  const source = c.req.query("source");
  if (source === "audius") {
    const id = c.req.query("id");
    if (!id) {
      throw new ApiError(400, "Provide ?source=audius&id=<track_id>.");
    }
    return audiusTrackStream(c, id);
  }
  if (source === "archive") {
    return archivePlayable(c);
  }
  throw new ApiError(
    400,
    "Supported legal stream sources are ?source=audius&id=<id> and ?source=archive&identifier=<id>."
  );
}

export async function mediaDownload(c: ApiContext) {
  const source = c.req.query("source");
  if (source !== "archive") {
    throw new ApiError(
      400,
      "Downloads are only resolved for Internet Archive public/free files. Use ?source=archive&identifier=<id>."
    );
  }
  return archivePlayable(c);
}

export async function mediaQuality(c: ApiContext) {
  const source = c.req.query("source") || "apple";
  if (source === "apple") {
    return {
      source,
      quality:
        "Apple/iTunes endpoints return metadata and short preview URLs only, usually AAC/M4A preview clips."
    };
  }
  if (source === "audius") {
    return {
      source,
      quality:
        "Audius streams open music from the Audius protocol. Exact bitrate depends on the uploaded/transcoded track and access rights."
    };
  }
  if (source === "archive") {
    return {
      source,
      quality:
        "Internet Archive files expose their original format, size, and derivative formats per item metadata."
    };
  }
  return {
    source,
    quality: "Unknown source. Use apple, audius, or archive."
  };
}

export async function mediaArtwork(c: ApiContext) {
  const provider = c.req.query("provider") || "apple";
  if (provider === "apple") {
    const id = c.req.query("id");
    if (!id) {
      throw new ApiError(400, "Provide ?provider=apple&id=<itunes_id>.");
    }
    return appleLookupById(c, id);
  }
  if (provider === "cover-art") {
    const release = c.req.query("release");
    const releaseGroup = c.req.query("releaseGroup") || c.req.query("release_group");
    if (release) {
      return coverArtJson(c, "release", release);
    }
    if (releaseGroup) {
      return coverArtJson(c, "release-group", releaseGroup);
    }
  }
  throw new ApiError(
    400,
    "Use ?provider=apple&id=<itunes_id> or ?provider=cover-art&release=<mbid>."
  );
}
