import { endpointCount, endpoints, type EndpointDoc } from "./endpoints";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function endpointRows(items: EndpointDoc[]) {
  return items
    .map(
      (endpoint) => `
        <tr>
          <td><span class="method">${endpoint.method}</span></td>
          <td><code>${escapeHtml(endpoint.path)}</code></td>
          <td>${escapeHtml(endpoint.provider)}</td>
          <td>${escapeHtml(endpoint.summary)}</td>
        </tr>`
    )
    .join("");
}

function providerCount() {
  return new Set(endpoints.map((endpoint) => endpoint.provider)).size;
}

const sourceNames = [
  "Apple/iTunes",
  "MusicBrainz",
  "Cover Art Archive",
  "Internet Archive",
  "Audius",
  "Deezer",
  "Radio Browser",
  "Openverse",
  "Wikidata",
  "Wikimedia",
  "ListenBrainz",
  "GitHub",
  "Odesli"
];

const docTabs = [
  ["start", "Overview"],
  ["quickstart", "Quickstart"],
  ["search-tabs", "Search"],
  ["media-tabs", "Media"],
  ["policy", "Limits"],
  ["providers", "Providers"],
  ["diagnostics", "Alive"],
  ["examples", "Examples"],
  ["endpoints", "Endpoints"],
  ["deploy", "Deploy"]
] as const;

const docTabDescriptions: Record<(typeof docTabs)[number][0], string> = {
  start: "Docs home",
  quickstart: "First calls",
  "search-tabs": "Search routes",
  "media-tabs": "Media helpers",
  policy: "Free policy",
  providers: "Source groups",
  diagnostics: "Alive checks",
  examples: "Curl samples",
  endpoints: "Route table",
  deploy: "Cloudflare"
};

function sourcePills() {
  return sourceNames.map((source) => `<span>${escapeHtml(source)}</span>`).join("\n");
}

function docsTabs() {
  return docTabs
    .map(([id, label]) => `<a href="#${id}">${escapeHtml(label)}</a>`)
    .join("\n");
}

function docsTabCards() {
  return docTabs
    .map(
      ([id, label]) => `
        <a class="doc-tab-card" href="#${id}">
          <span>${escapeHtml(label)}</span>
          <small>${escapeHtml(docTabDescriptions[id])}</small>
        </a>`
    )
    .join("\n");
}

function endpointGroups() {
  const groups = new Map<string, EndpointDoc[]>();
  for (const endpoint of endpoints) {
    const current = groups.get(endpoint.provider) || [];
    current.push(endpoint);
    groups.set(endpoint.provider, current);
  }

  return Array.from(groups.entries())
    .map(
      ([provider, items]) => `
        <article class="provider-card">
          <div>
            <span class="provider-name">${escapeHtml(provider)}</span>
            <strong>${items.length}</strong>
          </div>
          <p>${escapeHtml(items[0]?.summary || "Provider endpoints")}</p>
        </article>`
    )
    .join("");
}

function providerTabs() {
  const groups = new Map<string, EndpointDoc[]>();
  for (const endpoint of endpoints) {
    const current = groups.get(endpoint.provider) || [];
    current.push(endpoint);
    groups.set(endpoint.provider, current);
  }

  return Array.from(groups.entries())
    .map(([provider, items]) => {
      return `
        <a class="provider-tab" href="#endpoints">
          <span>
            <b>${escapeHtml(provider)}</b>
            <small>Endpoint registry group</small>
          </span>
          <strong>${items.length} routes</strong>
        </a>`;
    })
    .join("");
}

function routeCards(origin: string) {
  const cards = [
    {
      title: "Unified search",
      route: "/v1/search/tracks?q=believer",
      copy: "Aggregate legal metadata and previews across configured public sources."
    },
    {
      title: "Provider search",
      route: "/v1/deezer/search/tracks?q=believer",
      copy: "Call direct provider routes when you need a specific catalog response."
    },
    {
      title: "Open audio",
      route: "/v1/openverse/search/audio?q=piano",
      copy: "Find openly licensed audio and source metadata through Openverse."
    },
    {
      title: "Live radio",
      route: "/v1/radio-browser/stations/search?q=lofi",
      copy: "Discover public radio stations and stream URLs from Radio Browser."
    }
  ];

  return cards
    .map(
      (card) => `
        <article class="route-card">
          <span>${escapeHtml(card.title)}</span>
          <code>${escapeHtml(card.route)}</code>
          <p>${escapeHtml(card.copy)}</p>
          <a href="${escapeHtml(origin + card.route)}">Open route</a>
        </article>`
    )
    .join("");
}

function baseHead(title: string, description: string) {
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/site.css">
    <style>${siteCss()}</style>
  `;
}

function nav() {
  return `
    <nav class="topbar" aria-label="Primary navigation">
      <a class="brand" href="/" aria-label="SayaMusicAPI home">
        <span class="brand-mark" aria-hidden="true"></span>
        Saya Music API
      </a>
      <div class="nav-links">
        <a href="/docs">Docs</a>
        <a href="/v1/endpoints">Endpoints</a>
        <a href="/v1/openapi.json">OpenAPI</a>
        <a href="https://github.com/shnwazdeveloper/sayamusicapi">GitHub</a>
      </div>
    </nav>
  `;
}

export function landingPage(origin: string) {
  const example = `${origin}/v1/search/tracks?q=believer`;

  return `<!doctype html>
  <html lang="en">
    <head>
      ${baseHead(
        "SayaMusicAPI",
        "A Cloudflare Workers music API for legal search, metadata, artwork, previews, and open/free streams."
      )}
    </head>
    <body>
      ${nav()}
      <main>
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">Cloudflare edge music API</p>
            <h1>Saya Music API</h1>
            <p class="lede">
              A docs-first music API for legal search, metadata, artwork, previews, open streams, public radio, and free-source discovery from the Cloudflare edge.
            </p>
            <div class="actions">
              <a class="button primary" href="/v1/endpoints">View endpoints</a>
            </div>
          </div>
          <aside class="console-panel" aria-label="API example">
            <div class="console-head">
              <span></span><span></span><span></span>
            </div>
            <pre><code>GET ${escapeHtml(example)}

{
  "ok": true,
  "service": "SayaMusicAPI",
  "data": {
    "endpointCount": ${endpointCount},
    "media": "legal previews and open streams"
  }
}</code></pre>
            <div class="meter" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </aside>
        </section>

        <section class="tab-overview" id="docs-tabs" aria-label="Documentation tabs preview">
          <div class="tab-copy">
            <p class="eyebrow">Docs page</p>
            <h2>All API tabs in one place.</h2>
            <p>
              Saya Music API keeps quickstart, search, media helpers, providers, live examples, endpoint registry, and publishing steps together on the docs page.
            </p>
          </div>
          <div class="tab-grid">
            ${docsTabs()}
          </div>
        </section>

        <section class="stats-band" aria-label="API highlights">
          <div>
            <span>${endpointCount}</span>
            <p>documented API endpoints</p>
          </div>
          <div>
            <span>Free</span>
            <p>no API-side quotas, keys, or paid tiers</p>
          </div>
          <div>
            <span>${sourceNames.length}</span>
            <p>public source groups</p>
          </div>
        </section>

        <section class="provider-strip" aria-label="Providers">
          <div class="ticker">
            ${sourcePills()}
            ${sourcePills()}
          </div>
        </section>

        <section class="source-cloud" aria-label="Source map">
          <div>
            <p class="eyebrow">Source mesh</p>
            <h2>More legal web sources, one response shape.</h2>
          </div>
          <div class="source-list">
            ${sourceNames.map((source, index) => `<span style="--i:${index}">${escapeHtml(source)}</span>`).join("\n")}
          </div>
        </section>

        <section class="route-showcase" aria-label="API route examples">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Live routes</p>
              <h2>Start with the tabs developers actually need.</h2>
            </div>
          </div>
          <div class="route-grid">
            ${routeCards(origin)}
          </div>
        </section>

        <section class="section-grid">
          <article>
            <h2>Search Surface</h2>
            <p>Aggregate search plus direct provider routes for tracks, albums, artists, videos, podcasts, audiobooks, releases, recordings, public radio, open audio, and source discovery.</p>
          </article>
          <article>
            <h2>Media Policy</h2>
            <p>Preview clips, official store links, open Audius streams, and Internet Archive public files. No DRM bypassing, no unauthorized song scraping.</p>
          </article>
          <article>
            <h2>Free Access</h2>
            <p>No API key is required by SayaMusicAPI. Upstream services may still enforce their own public page sizes and fair-use rules.</p>
          </article>
        </section>
      </main>
    </body>
  </html>`;
}

export function docsPage(origin: string) {
  const aggregateExample = `${origin}/v1/search/tracks?q=believer`;
  const appleExample = `${origin}/v1/apple/search/songs?q=believer`;
  const deezerExample = `${origin}/v1/deezer/search/tracks?q=believer`;
  const openverseExample = `${origin}/v1/openverse/search/audio?q=piano`;
  const previewExample = `${origin}/v1/media/preview?q=believer`;
  const streamExample = `${origin}/v1/media/stream?source=audius&id=TRACK_ID`;
  const diagnosticsExample = `${origin}/v1/diagnostics/routes`;

  return `<!doctype html>
  <html lang="en">
    <head>
      ${baseHead(
        "SayaMusicAPI Docs",
        "Documentation for SayaMusicAPI endpoints, provider routes, legal media policy, and Cloudflare deployment."
      )}
    </head>
    <body class="docs-page">
      ${nav()}
      <main class="docs-shell">
        <aside class="docs-aside" aria-label="Documentation sections">
          ${docsTabs()}
        </aside>

        <article class="docs-content">
          <header class="docs-hero" id="start">
            <p class="eyebrow">Documentation</p>
            <h1>Saya Music API docs</h1>
            <p>
              Use the hosted Cloudflare Worker or deploy your own copy. JSON endpoints live under <code>/v1</code>; this docs page collects every main tab for quickstart, search, media, providers, examples, endpoint registry, and Cloudflare deployment. The registry publishes <strong>${endpointCount}</strong> routes across <strong>${providerCount()}</strong> provider groups.
            </p>
          </header>

          <nav class="docs-tab-board" aria-label="Documentation tabs">
            ${docsTabCards()}
          </nav>

          <section class="doc-section" id="quickstart">
            <div class="section-heading">
              <h2>Quickstart</h2>
              <a class="button compact" href="/v1">API root</a>
            </div>
            <p>
              Start with one search route, then move into provider-specific tabs when you need exact source behavior. Every route returns JSON and public CORS headers.
            </p>
            <div class="code-grid">
              <pre><code>curl "${escapeHtml(aggregateExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(origin)}/health"</code></pre>
              <pre><code>curl "${escapeHtml(origin)}/v1/endpoints"</code></pre>
            </div>
          </section>

          <section class="doc-section" id="search-tabs">
            <div class="section-heading">
              <h2>Search Tabs</h2>
              <a class="button compact" href="/v1/search/tracks?q=believer">Try aggregate</a>
            </div>
            <p>
              These tabs cover the most useful search surfaces: aggregate search, direct provider lookup, open audio, and public radio streams.
            </p>
            <div class="route-grid">
              ${routeCards(origin)}
            </div>
          </section>

          <section class="doc-section" id="media-tabs">
            <div class="section-heading">
              <h2>Media Helper Tabs</h2>
              <a class="button compact" href="/v1/quality">Quality policy</a>
            </div>
            <div class="media-tabs">
              <article>
                <span>Preview</span>
                <code>/v1/media/preview</code>
                <p>Find legal short preview clips from supported providers.</p>
              </article>
              <article>
                <span>Stream</span>
                <code>/v1/media/stream</code>
                <p>Resolve open streams where the provider grants public access.</p>
              </article>
              <article>
                <span>Download</span>
                <code>/v1/media/download</code>
                <p>Return public/free file links, especially Internet Archive item files.</p>
              </article>
              <article>
                <span>Artwork</span>
                <code>/v1/media/artwork</code>
                <p>Resolve artwork from Apple/iTunes and Cover Art Archive sources.</p>
              </article>
            </div>
          </section>

          <section class="doc-section" id="policy">
            <h2>Free Limit Policy</h2>
            <p>
              SayaMusicAPI does not add API keys, paid tiers, user quotas, or gateway rate limits. Result page sizes default to each provider's public maximum when that provider has one. That keeps the API free while avoiding failed upstream calls.
            </p>
            <div class="notice">
              Upstream providers can still enforce their own rate limits, paging, licensing, and availability rules.
            </div>
          </section>

          <section class="doc-section" id="providers">
            <div class="section-heading">
              <h2>Provider Groups</h2>
              <a class="button compact" href="/v1/sources">Source JSON</a>
            </div>
            <div class="provider-tabs" aria-label="Provider endpoint tabs">
              ${providerTabs()}
            </div>
            <div class="provider-grid">
              ${endpointGroups()}
            </div>
          </section>

          <section class="doc-section" id="diagnostics">
            <h2>Alive and Diagnostics</h2>
            <p>
              The API exposes simple alive routes plus route/source diagnostics. These are fast checks for uptime monitors and for confirming that the deployed endpoint registry is healthy.
            </p>
            <div class="diagnostic-links">
              <a href="/alive">/alive</a>
              <a href="/v1/status">/v1/status</a>
              <a href="/v1/diagnostics">/v1/diagnostics</a>
              <a href="/v1/diagnostics/routes">/v1/diagnostics/routes</a>
            </div>
          </section>

          <section class="doc-section" id="examples">
            <h2>Examples</h2>
            <div class="code-grid">
              <pre><code>curl "${escapeHtml(aggregateExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(appleExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(deezerExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(openverseExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(previewExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(streamExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(diagnosticsExample)}"</code></pre>
            </div>
          </section>

          <section class="doc-section" id="endpoints">
            <div class="section-heading">
              <h2>Endpoint Registry</h2>
              <a class="button compact" href="/v1/openapi.json">OpenAPI JSON</a>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Provider</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  ${endpointRows(endpoints)}
                </tbody>
              </table>
            </div>
          </section>

          <section class="doc-section" id="deploy">
            <div class="section-heading">
              <h2>Cloudflare Deploy</h2>
              <a class="button compact" href="https://github.com/shnwazdeveloper/sayamusicapi">GitHub repo</a>
            </div>
            <p>
              The repository is already configured for Cloudflare Workers with <code>wrangler.jsonc</code>. Push the repo to GitHub, then deploy with Wrangler from the project folder.
            </p>
            <div class="deploy-steps">
              <pre><code>npm install
npm run typecheck
npm test
npm run deploy</code></pre>
            </div>
          </section>
        </article>
      </main>
    </body>
  </html>`;
}

export function siteCss() {
  return `
:root {
  color-scheme: light;
  --ink: #171a1c;
  --muted: #5f666d;
  --line: #d9dde2;
  --paper: #f7f8f6;
  --panel: #ffffff;
  --green: #147d64;
  --coral: #cf4d3f;
  --gold: #d89a25;
  --blue: #226f95;
  --black: #111315;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background: var(--paper);
  letter-spacing: 0;
  overflow-x: hidden;
}

.docs-page *,
.docs-page *::before,
.docs-page *::after {
  animation: none !important;
}

a {
  color: inherit;
  text-decoration: none;
}

code,
pre {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 74px;
  padding: 10px 6vw;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  transition: transform 180ms ease;
}

.brand:hover {
  transform: translateY(-2px);
}

.brand-mark {
  width: 24px;
  height: 24px;
  border: 2px solid var(--black);
  border-radius: 8px;
  background:
    linear-gradient(90deg, var(--green) 0 33%, var(--gold) 33% 66%, var(--coral) 66%);
  animation: markSlide 3s steps(3) infinite;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  overflow-x: auto;
  padding: 5px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
  scrollbar-width: none;
}

.nav-links::-webkit-scrollbar {
  display: none;
}

.nav-links a {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 10px 14px;
  color: var(--muted);
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  transition: background-color 180ms ease, color 180ms ease;
}

.nav-links a:first-child {
  color: #fff;
  background: var(--black);
}

.nav-links a:hover {
  color: var(--ink);
  background: #eef1ed;
}

.button {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--panel);
  transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease;
}

.button:hover {
  transform: translateY(-2px);
  border-color: var(--ink);
}

.button.primary {
  border-color: var(--black);
  color: #fff;
  background: var(--black);
}

.button.compact {
  padding: 8px 10px;
  font-size: 14px;
}

.hero {
  min-height: 76vh;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 440px);
  align-items: center;
  gap: 36px;
  padding: 8vh 6vw 6vh;
  border-bottom: 1px solid var(--line);
}

.tab-overview,
.route-showcase {
  padding: 56px 6vw;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}

.tab-overview {
  display: grid;
  grid-template-columns: minmax(240px, 0.8fr) 1.2fr;
  gap: 24px;
  align-items: center;
}

.tab-copy h2,
.route-showcase h2 {
  margin: 0;
  max-width: 720px;
  font-size: clamp(32px, 4vw, 58px);
  line-height: 1;
}

.tab-copy p:last-child {
  color: var(--muted);
  line-height: 1.6;
}

.tab-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tab-grid a,
.doc-tab-card,
.provider-tab,
.route-card,
.media-tabs article {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}

.tab-grid a,
.doc-tab-card {
  padding: 12px 14px;
  font-weight: 800;
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.tab-grid a:nth-child(3n) {
  background: #e8f2ef;
}

.tab-grid a:nth-child(3n + 1) {
  background: #f6e9e6;
}

.tab-grid a:nth-child(3n + 2) {
  background: #f8f1e3;
}

.tab-grid a:hover,
.doc-tab-card:hover {
  transform: translateY(-2px);
  border-color: var(--black);
}

.route-grid,
.media-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.route-card,
.media-tabs article {
  padding: 18px;
}

.route-card span,
.media-tabs span {
  display: block;
  margin-bottom: 12px;
  font-weight: 900;
}

.route-card code,
.media-tabs code {
  display: block;
  margin-bottom: 12px;
  overflow-wrap: anywhere;
  color: var(--green);
  font-size: 13px;
}

.route-card p,
.media-tabs p {
  color: var(--muted);
  line-height: 1.55;
}

.route-card a {
  display: inline-flex;
  margin-top: 4px;
  color: var(--blue);
  font-weight: 800;
}

.hero-copy,
.console-panel {
  animation: enter 520ms ease both;
}

.eyebrow {
  margin: 0 0 16px;
  color: var(--green);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
}

h1 {
  margin: 0;
  max-width: 820px;
  font-size: clamp(42px, 5.6vw, 76px);
  line-height: 1;
  letter-spacing: 0;
  text-wrap: balance;
}

.lede {
  max-width: 720px;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: clamp(18px, 2vw, 24px);
  line-height: 1.45;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.console-panel {
  border: 1px solid var(--black);
  border-radius: 8px;
  background: var(--panel);
  overflow: hidden;
}

.console-head {
  display: flex;
  gap: 8px;
  padding: 14px;
  border-bottom: 1px solid var(--line);
  background: #eef1ed;
}

.console-head span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--black);
}

.console-head span:nth-child(1) { background: var(--coral); }
.console-head span:nth-child(2) { background: var(--gold); }
.console-head span:nth-child(3) { background: var(--green); }

.console-panel pre {
  margin: 0;
  padding: 22px;
  overflow-x: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #e6ece8;
  background: var(--black);
  font-size: 14px;
  line-height: 1.7;
}

.meter {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  height: 52px;
  padding: 12px;
  border-top: 1px solid var(--line);
}

.meter span {
  align-self: end;
  height: 22px;
  border-radius: 4px;
  background: var(--green);
  animation: meter 1.4s ease-in-out infinite alternate;
}

.meter span:nth-child(2) { background: var(--blue); animation-delay: 120ms; }
.meter span:nth-child(3) { background: var(--gold); animation-delay: 240ms; }
.meter span:nth-child(4) { background: var(--coral); animation-delay: 360ms; }
.meter span:nth-child(5) { background: var(--black); animation-delay: 480ms; }

.stats-band {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--line);
}

.stats-band div {
  padding: 34px 6vw;
  border-right: 1px solid var(--line);
  background: var(--panel);
}

.stats-band div:last-child {
  border-right: 0;
}

.stats-band span {
  display: block;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 900;
}

.stats-band p,
.section-grid p,
.doc-section p,
.provider-card p {
  color: var(--muted);
  line-height: 1.6;
}

.provider-strip {
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background: #eef1ed;
}

.ticker {
  display: flex;
  width: max-content;
  gap: 12px;
  padding: 14px 0;
  animation: ticker 22s linear infinite;
}

.ticker span {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 16px;
  background: var(--panel);
  white-space: nowrap;
}

.source-cloud {
  display: grid;
  grid-template-columns: minmax(240px, 0.7fr) 1.3fr;
  gap: 24px;
  padding: 56px 6vw;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}

.source-cloud h2 {
  margin: 0;
  max-width: 620px;
  font-size: clamp(32px, 4vw, 58px);
  line-height: 1;
}

.source-list {
  display: flex;
  align-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.source-list span {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 11px 14px;
  background: #f8f1e3;
  animation: sourceStep 3.6s ease-in-out infinite alternate;
  animation-delay: calc(var(--i) * 70ms);
}

.source-list span:nth-child(3n) {
  background: #e8f2ef;
}

.source-list span:nth-child(3n + 1) {
  background: #f6e9e6;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  padding: 64px 6vw;
}

.section-grid article,
.provider-card,
.notice,
.code-grid pre {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}

.section-grid article {
  padding: 24px;
}

.section-grid h2,
.doc-section h2,
.docs-hero h1 {
  margin: 0;
  letter-spacing: 0;
}

.docs-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  padding: 28px 6vw 72px;
}

.docs-aside {
  position: sticky;
  top: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  scrollbar-width: none;
}

.docs-aside::-webkit-scrollbar {
  display: none;
}

.docs-aside a {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 10px 13px;
  color: var(--muted);
  font-weight: 800;
  line-height: 1;
  transition: background-color 180ms ease, color 180ms ease;
}

.docs-aside a:first-child,
.docs-aside a:hover {
  color: #fff;
  background: var(--black);
}

.docs-content {
  display: grid;
  gap: 20px;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.docs-hero,
.doc-section {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: clamp(22px, 4vw, 42px);
  background: var(--panel);
  scroll-margin-top: 92px;
}

.docs-hero h1 {
  font-size: clamp(36px, 5vw, 72px);
  line-height: 1;
}

.docs-tab-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.doc-tab-card {
  display: grid;
  gap: 6px;
  min-height: 74px;
  align-content: center;
  border-radius: 14px;
  background: var(--panel);
}

.doc-tab-card span {
  color: var(--ink);
  font-size: 15px;
}

.doc-tab-card small {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.notice {
  margin-top: 16px;
  padding: 14px 16px;
  border-color: var(--gold);
  background: #fff8e9;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.provider-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.provider-tab {
  display: grid;
  align-content: start;
  gap: 12px;
  min-height: 112px;
  padding: 16px;
  background: var(--panel);
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.provider-tab:hover {
  transform: translateY(-2px);
  border-color: var(--black);
  background: #eef1ed;
}

.provider-tab span {
  display: grid;
  gap: 5px;
}

.provider-tab b {
  font-size: 15px;
  font-weight: 900;
}

.provider-tab strong {
  justify-self: start;
  width: max-content;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 10px;
  color: var(--ink);
  background: #f7f8f6;
  font-size: 13px;
}

.provider-tab small {
  color: var(--muted);
  line-height: 1.5;
}

.provider-card {
  padding: 18px;
}

.provider-card div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.provider-card strong {
  display: inline-grid;
  place-items: center;
  min-width: 36px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink);
  background: #f7f8f6;
}

.provider-name {
  font-weight: 800;
}

.diagnostic-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.diagnostic-links a {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 14px;
  background: #eef1ed;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  transition: transform 180ms ease, border-color 180ms ease;
}

.diagnostic-links a:hover {
  transform: translateY(-2px);
  border-color: var(--black);
}

.code-grid {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.code-grid pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: var(--black);
  color: #e6ece8;
}

.deploy-steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.7fr);
  gap: 14px;
  align-items: stretch;
}

.deploy-steps pre {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
  overflow: auto;
  background: var(--black);
  color: #e6ece8;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
}

.table-wrap {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
  background: var(--panel);
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: #eef1ed;
}

.method {
  display: inline-flex;
  border: 1px solid var(--green);
  border-radius: 6px;
  padding: 4px 7px;
  color: var(--green);
  font-weight: 800;
  font-size: 12px;
}

@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes meter {
  from { height: 12px; }
  to { height: 36px; }
}

@keyframes ticker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes markSlide {
  from { background-position: 0 0; }
  to { background-position: 24px 0; }
}

@keyframes sourceStep {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

@media (max-width: 860px) {
  .topbar,
  .hero,
  .tab-overview,
  .route-showcase,
  .section-grid,
  .docs-shell,
  .source-cloud {
    padding-left: 20px;
    padding-right: 20px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .hero,
  .tab-overview,
  .section-grid,
  .docs-shell,
  .source-cloud,
  .stats-band,
  .deploy-steps {
    grid-template-columns: 1fr;
  }

  .stats-band div {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .docs-aside {
    position: static;
    width: 100%;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
`;
}
