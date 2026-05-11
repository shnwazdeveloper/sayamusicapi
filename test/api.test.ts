import { describe, expect, it } from "vitest";
import app from "../src/index";
import { endpointCount, endpoints } from "../src/endpoints";

describe("SayaMusicAPI", () => {
  it("publishes more than 60 endpoints", () => {
    expect(endpointCount).toBeGreaterThanOrEqual(60);
    expect(endpoints.length).toBe(endpointCount);
  });

  it("responds to health checks", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.ok).toBe(true);
    expect(body.data.endpointCount).toBe(endpointCount);
  });

  it("serves the endpoint registry", async () => {
    const response = await app.request("/v1/endpoints");
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.count).toBe(endpointCount);
    expect(body.data.some((item: any) => item.path === "/v1/apple/search/songs")).toBe(true);
  });

  it("validates required search query params", async () => {
    const response = await app.request("/v1/apple/search/songs");
    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.ok).toBe(false);
    expect(body.error.message).toContain("Missing required query parameter");
  });
});
