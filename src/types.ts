export type Env = {
  API_NAME?: string;
  DEFAULT_COUNTRY?: string;
  CACHE_TTL_SECONDS?: string;
  AUDIUS_API_KEY?: string;
};

export type ApiBindings = {
  Bindings: Env;
};

export type ApiMeta = Record<string, unknown>;

export type ProviderName =
  | "core"
  | "aggregate"
  | "apple"
  | "musicbrainz"
  | "cover-art"
  | "archive"
  | "audius"
  | "jiosaavn"
  | "gaana"
  | "deezer"
  | "radio-browser"
  | "openverse"
  | "wikidata"
  | "wikimedia"
  | "listenbrainz"
  | "github"
  | "odesli"
  | "web";
