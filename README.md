# SayaMusicAPI

A Cloudflare Workers music API for legal music discovery: search, metadata, artwork, preview clips, open Audius streams, and Internet Archive public/free media links.

This project intentionally does not scrape unauthorized song files or bypass copyright, paywalls, DRM, or provider access rules.

## Features

- 900+ GET endpoints across Apple/iTunes, MusicBrainz, Cover Art Archive, Internet Archive, Audius, Deezer, Radio Browser, Openverse, Wikidata, Wikimedia, ListenBrainz, GitHub, and Odesli.
- Landing page at `/` and documentation page at `/docs`.
- Docs-first website with tabs for quickstart, search, media helpers, providers, examples, endpoint registry, and Cloudflare deploy.
- No API-side quotas, API keys, paid tiers, request throttling, or result caps added by SayaMusicAPI.
- Cloudflare Workers deployment with Wrangler.
- CORS enabled for public apps.
- Built-in `/v1/endpoints` registry and `/v1/openapi.json`.
- Legal media helpers for preview, stream, download, quality, artwork, and matching.

## Quick Start

```bash
npm install
npm run dev
```

Local API:

```text
http://localhost:8787
```

Example calls:

```bash
curl "http://localhost:8787/v1/search/tracks?q=alan%20walker"
curl "http://localhost:8787/v1/apple/search/songs?q=believer"
curl "http://localhost:8787/v1/deezer/search/tracks?q=believer"
curl "http://localhost:8787/v1/openverse/search/audio?q=piano"
curl "http://localhost:8787/v1/radio-browser/stations/search?q=lofi"
curl "http://localhost:8787/v1/musicbrainz/search/recordings?q=dua%20lipa"
curl "http://localhost:8787/v1/archive/search/music?q=jazz"
```

SayaMusicAPI does not add a result cap. Provider paging inputs are passed through only when clients send them; upstream providers may still enforce their own public paging rules.

## Cloudflare Deploy

```bash
npm run typecheck
npm test
npm run deploy
```

## Important Endpoints

```text
GET /health
GET /v1/endpoints
GET /v1/openapi.json
GET /v1/search/tracks?q=...
GET /v1/media/preview?q=...
GET /v1/media/stream?source=audius&id=...
GET /v1/media/download?source=archive&identifier=...
GET /v1/media/artwork?provider=cover-art&release=...
```

## Provider Notes

- Apple/iTunes: metadata, artwork, store links, and short preview clips.
- MusicBrainz: structured open music metadata, relationships, recordings, releases, artists, and ISRC lookup.
- Cover Art Archive: release and release-group cover art.
- Internet Archive: public/free item metadata and file links. Check item license metadata before reuse.
- Audius: open music catalog and stream resolution.
- Deezer: public metadata, chart, artwork, and preview clip routes.
- Radio Browser: public radio station metadata and stream URLs.
- Openverse: openly licensed audio and image discovery.
- Wikidata/Wikimedia: open knowledge search, page summaries, and entity metadata.
- ListenBrainz: public music stats and metadata lookup.
- GitHub: public repository discovery for music/API/source references.
- Odesli: cross-platform smart links for song, album, and podcast URLs.

## Tests

```bash
npm test
npm run typecheck
npm run endpoints
npm run audit:endpoints
npm run audit:endpoints:smoke
```

## License

MIT
