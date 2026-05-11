import { describe, expect, it } from "vitest";
import app from "../src/index";
import { endpointCount, endpoints } from "../src/endpoints";

describe("SayaMusicAPI", () => {
  it("publishes more than 300 endpoints", () => {
    expect(endpointCount).toBeGreaterThanOrEqual(300);
    expect(endpoints.length).toBe(endpointCount);
  });

  it("responds to health checks", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.ok).toBe(true);
    expect(body.data.endpointCount).toBe(endpointCount);
  });

  it("serves the landing page and docs page", async () => {
    const landing = await app.request("/");
    expect(landing.status).toBe(200);
    expect(landing.headers.get("content-type")).toContain("text/html");
    const landingHtml = await landing.text();
    expect(landingHtml).toContain("SayaMusicAPI");
    expect(landingHtml).not.toContain("Try a search");
    expect(landingHtml).not.toContain("header-motion");
    expect(landingHtml).toContain('<a href="/docs">Docs</a>');
    expect(landingHtml).not.toContain('<a href="/docs#quickstart">Quickstart</a>');
    expect(landingHtml).not.toContain('<a href="/docs#examples">Examples</a>');
    expect(landingHtml).not.toContain('<a href="/docs#deploy">Deploy</a>');
    expect(landingHtml).not.toContain('<a class="button primary" href="/docs">Open docs</a>');
    expect(landingHtml).not.toContain('<a class="button" href="/docs#deploy">Cloudflare deploy</a>');
    expect(landingHtml).not.toContain("hero-chips");
    expect(landingHtml).not.toContain("Deezer tracks");
    expect(landingHtml).not.toContain("Radio streams");

    const docs = await app.request("/docs");
    expect(docs.status).toBe(200);
    const docsHtml = await docs.text();
    expect(docsHtml).toContain("Free Limit Policy");
    expect(docsHtml).not.toContain("AUDIUS_API_KEY");
    expect(docsHtml).not.toContain("wrangler secret put");
    expect(docsHtml).not.toContain("route-flow");
    expect(docsHtml).not.toContain("providerRail");
    expect(docsHtml).not.toContain(".docs-hero,\n.doc-section {\n  animation");
    expect(docsHtml).toContain('class="docs-tab-board"');
    expect(docsHtml).toContain('class="doc-tab-card"');
    expect(docsHtml).not.toContain('class="doc-tabs"');

    const css = await app.request("/site.css");
    const cssText = await css.text();
    expect(cssText).not.toMatch(/glow|box-shadow|drop-shadow|text-shadow|filter:/i);
    expect(cssText).toContain("@keyframes");
    expect(cssText).toContain(".docs-page *");
    expect(cssText).not.toContain(".doc-tabs");
    expect(cssText).not.toContain(".provider-tab:nth-child");
  });

  it("serves the endpoint registry", async () => {
    const response = await app.request("/v1/endpoints");
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.count).toBe(endpointCount);
    expect(body.data.some((item: any) => item.path === "/v1/apple/search/songs")).toBe(true);
    expect(body.data.some((item: any) => item.path === "/v1/deezer/search/tracks")).toBe(true);
    expect(body.data.some((item: any) => item.path === "/v1/openverse/search/audio")).toBe(true);
  });

  it("validates required search query params", async () => {
    const response = await app.request("/v1/apple/search/songs");
    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("Missing required query parameter");
  });

  it("serves alive and diagnostics routes", async () => {
    const alive = await app.request("/alive");
    expect(alive.status).toBe(200);
    const aliveBody = (await alive.json()) as any;
    expect(aliveBody.data.endpointCount).toBe(endpointCount);

    const diagnostics = await app.request("/v1/diagnostics/routes");
    expect(diagnostics.status).toBe(200);
    const diagnosticsBody = (await diagnostics.json()) as any;
    expect(diagnosticsBody.data.endpointCount).toBe(endpointCount);
    expect(diagnosticsBody.data.providers.deezer).toBeGreaterThan(0);
  });

  it("routes new providers instead of falling through to 404", async () => {
    const smokePaths = [
      "/v1/deezer/search/tracks",
      "/v1/openverse/search/audio",
      "/v1/wikidata/search/items",
      "/v1/listenbrainz/metadata/lookup",
      "/v1/odesli/links",
      "/v1/web/deezer/search/tracks"
    ];

    for (const path of smokePaths) {
      const response = await app.request(path);
      expect(response.status).not.toBe(404);
    }
  });
});
