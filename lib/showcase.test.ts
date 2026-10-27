import { afterEach, expect, test, vi } from "vitest";
import { POST as research } from "../app/api/research/route";
import { POST as ask } from "../app/api/ask/route";
import { POST as kit } from "../app/api/kit/route";
import { POST as labels } from "../app/api/labels/route";
import { chat } from "./openrouter";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

test.each([undefined, "false"])("paid routes refuse requests before any fetch when opt-in is %s", async (flag) => {
  vi.stubEnv("SHOWCASE_ENABLE_LIVE", flag);
  vi.stubEnv("OPENROUTER_API_KEY", "not-a-real-credential");
  const network = vi.fn(() => { throw new Error("Unexpected network call"); });
  vi.stubGlobal("fetch", network);
  for (const route of [research, ask, kit]) {
    const res = await route(new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify({ keyword: "claymorphism" }) }));
    expect(res.status).toBe(403);
  }
  await expect(chat({ model: "test-model" })).rejects.toThrow("disabled in this showcase");
  expect(network).not.toHaveBeenCalled();
});

test("review endpoint refuses writes even in development without a separate opt-in", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("SHOWCASE_ENABLE_REVIEW", undefined);
  const res = await labels(new Request("http://localhost/api/labels", { method: "POST", body: JSON.stringify({ items: [] }) }));
  expect(res.status).toBe(404);
});
