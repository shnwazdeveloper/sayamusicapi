# SayaMusicAPI

A Cloudflare Workers music API for legal music discovery: search, metadata, artwork, preview clips, open Audius streams, and Internet Archive public/free media links.

This project intentionally does not scrape unauthorized song files or bypass copyright, paywalls, DRM, or provider access rules.

## Features

- 100+ GET endpoints across Apple/iTunes, MusicBrainz, Cover Art Archive, Internet Archive, and Audius.
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
curl "http://localhost:8787/v1/search/tracks?q=alan%20walker&limit=5"
curl "http://localhost:8787/v1/apple/search/songs?q=believer&limit=5"
curl "http://localhost:8787/v1/musicbrainz/search/recordings?q=dua%20lipa&limit=5"
curl "http://localhost:8787/v1/archive/search/music?q=jazz&limit=5"
```

## Cloudflare Deploy

```bash
npm run deploy
```

Optional Audius key:

```bash
wrangler secret put AUDIUS_API_KEY
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
- Audius: open music catalog and stream resolution. An API token is recommended for reliable higher-rate use.

## Tests

```bash
npm test
npm run typecheck
npm run endpoints
```

## License

MIT
