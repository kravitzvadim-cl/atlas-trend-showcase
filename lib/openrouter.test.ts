import { expect, test } from "vitest";
import { chat, ProviderError } from "./openrouter";

const ok = (model: string) => ({ model, choices: [{ finish_reason: "stop", message: { content: "{}" } }], usage: { cost: 0.001 } });

test("an Anthropic outage falls back once to the backup model and says so", async () => {
  const calls: string[] = [];
  const send = async (b: Record<string, unknown>) => {
    calls.push(String(b.model));
    if (b.model === "anthropic/claude-haiku-5.5") throw new ProviderError("OpenRouter error (503).", true);
    return ok(String(b.model));
  };
  const r = await chat({ model: "anthropic/claude-haiku-5.5" }, send, "google/gemini-2.5-flash");
  expect(calls).toEqual(["anthropic/claude-haiku-5.5", "google/gemini-2.5-flash"]);
  expect(r.usedFallback).toBe(true);
  expect(r.model).toBe("google/gemini-2.5-flash");
});

test("a safety refusal is never retried on another model", async () => {
  const calls: string[] = [];
  const send = async (b: Record<string, unknown>) => {
    calls.push(String(b.model));
    throw new ProviderError("The model declined this request. Nothing was retried.", false);
  };
  await expect(chat({ model: "anthropic/claude-haiku-5.5" }, send, "google/gemini-2.5-flash")).rejects.toThrow("declined");
  expect(calls).toEqual(["anthropic/claude-haiku-5.5"]);
});

test("a key or credit problem is not retried either", async () => {
  const calls: string[] = [];
  const send = async (b: Record<string, unknown>) => {
    calls.push(String(b.model));
    throw new ProviderError("OpenRouter credit limit reached.", false);
  };
  await expect(chat({ model: "a" }, send, "b")).rejects.toThrow("credit");
  expect(calls).toEqual(["a"]);
});
