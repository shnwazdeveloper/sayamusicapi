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

function baseHead(title: string, description: string) {
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/site.css">
  `;
}

function nav() {
  return `
    <nav class="topbar" aria-label="Primary navigation">
      <a class="brand" href="/" aria-label="SayaMusicAPI home">
        <span class="brand-mark" aria-hidden="true"></span>
        SayaMusicAPI
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
            <h1>SayaMusicAPI</h1>
            <p class="lede">
              Legal music search, metadata, artwork, previews, and open/free stream resolution from public provider APIs.
            </p>
            <div class="actions">
              <a class="button primary" href="/docs">Open docs</a>
              <a class="button" href="/v1/endpoints">View endpoints</a>
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

        <section class="stats-band" aria-label="API highlights">
          <div>
            <span>${endpointCount}</span>
            <p>documented API endpoints</p>
          </div>
          <div>
            <span>0</span>
            <p>API-side quotas or paid tiers</p>
          </div>
          <div>
            <span>5</span>
            <p>public music data sources</p>
          </div>
        </section>

        <section class="provider-strip" aria-label="Providers">
          <div class="ticker">
            <span>Apple/iTunes</span>
            <span>MusicBrainz</span>
            <span>Cover Art Archive</span>
            <span>Internet Archive</span>
            <span>Audius</span>
            <span>Cloudflare Workers</span>
          </div>
        </section>

        <section class="section-grid">
          <article>
            <h2>Search Surface</h2>
            <p>Aggregate search plus direct provider routes for tracks, albums, artists, videos, podcasts, audiobooks, releases, recordings, and public archive media.</p>
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
  const appleExample = `${origin}/v1/apple/search/songs?q=believer`;
  const previewExample = `${origin}/v1/media/preview?q=believer`;
  const archiveExample = `${origin}/v1/archive/search/music?q=jazz`;

  return `<!doctype html>
  <html lang="en">
    <head>
      ${baseHead(
        "SayaMusicAPI Docs",
        "Documentation for SayaMusicAPI endpoints, provider routes, legal media policy, and Cloudflare deployment."
      )}
    </head>
    <body>
      ${nav()}
      <main class="docs-shell">
        <aside class="docs-aside" aria-label="Documentation sections">
          <a href="#start">Start</a>
          <a href="#policy">Limits</a>
          <a href="#providers">Providers</a>
          <a href="#examples">Examples</a>
          <a href="#endpoints">Endpoints</a>
        </aside>

        <article class="docs-content">
          <header class="docs-hero" id="start">
            <p class="eyebrow">Documentation</p>
            <h1>${endpointCount} endpoint music API</h1>
            <p>
              Use the public hosted Worker or deploy your own copy. JSON endpoints live under <code>/v1</code>; the homepage and this docs page are the UI layer.
            </p>
          </header>

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
            <h2>Provider Groups</h2>
            <div class="provider-grid">
              ${endpointGroups()}
            </div>
          </section>

          <section class="doc-section" id="examples">
            <h2>Examples</h2>
            <div class="code-grid">
              <pre><code>curl "${escapeHtml(appleExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(previewExample)}"</code></pre>
              <pre><code>curl "${escapeHtml(archiveExample)}"</code></pre>
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
  gap: 24px;
  min-height: 68px;
  padding: 0 6vw;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
}

.brand-mark {
  width: 24px;
  height: 24px;
  border: 2px solid var(--black);
  border-radius: 8px;
  background:
    linear-gradient(90deg, var(--green) 0 33%, var(--gold) 33% 66%, var(--coral) 66%);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-links a,
.button {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--panel);
  transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease;
}

.nav-links a:hover,
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
  grid-template-columns: minmax(0, 1fr) minmax(320px, 520px);
  align-items: center;
  gap: 48px;
  padding: 8vh 6vw 6vh;
  border-bottom: 1px solid var(--line);
}

.hero-copy,
.console-panel,
.docs-hero,
.doc-section {
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
  font-size: clamp(48px, 8vw, 112px);
  line-height: 0.92;
  letter-spacing: 0;
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
  overflow: auto;
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
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 36px;
  padding: 36px 6vw 72px;
}

.docs-aside {
  position: sticky;
  top: 92px;
  align-self: start;
  display: grid;
  gap: 8px;
}

.docs-aside a {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--panel);
}

.docs-content {
  display: grid;
  gap: 20px;
}

.docs-hero,
.doc-section {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: clamp(22px, 4vw, 42px);
  background: var(--panel);
}

.docs-hero h1 {
  font-size: clamp(36px, 5vw, 72px);
  line-height: 1;
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
  border-radius: 8px;
  color: #fff;
  background: var(--black);
}

.provider-name {
  font-weight: 800;
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

@media (max-width: 860px) {
  .topbar,
  .hero,
  .section-grid,
  .docs-shell {
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
  .section-grid,
  .docs-shell,
  .stats-band {
    grid-template-columns: 1fr;
  }

  .stats-band div {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .docs-aside {
    position: static;
    grid-template-columns: repeat(2, 1fr);
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
