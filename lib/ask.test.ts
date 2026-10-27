import { expect, test } from "vitest";
import { applyActions, emptyExtras, parseAskRequest, type AskAnswer } from "./ask";
import { askScout } from "./openrouter";

const act = (a: Partial<AskAnswer["actions"][number]>): AskAnswer["actions"][number] => ({ type: "add_component", component: "none", name: "", hex: "", note: "", font: "none", role: "none", value: 0, ...a });

test("Scout's actions add and remove components and colours", () => {
  let e = applyActions(emptyExtras, [act({ component: "pricing" }), act({ type: "add_color", name: "Soft sky", hex: "#b8d4ff", note: "softer accent" })]);
  expect(e).toEqual({ components: ["pricing"], colors: [{ name: "Soft sky", hex: "#B8D4FF", note: "softer accent" }], fonts: [] });
  e = applyActions(e, [act({ type: "remove_component", component: "pricing" }), act({ type: "remove_color", hex: "#B8D4FF" })]);
  expect(e).toEqual(emptyExtras);
});

test("unknown components, bad colours, duplicates and floods are dropped", () => {
  const e = applyActions(emptyExtras, [
    act({ component: "calendar" as never }),
    act({ component: "toast" }),
    act({ component: "toast" }),
    act({ type: "add_color", hex: "red" }),
    act({ type: "add_color", hex: "#12345", name: "x" }),
    act({ type: "add_color", hex: "#123456", name: "<b>evil</b>\nname" }),
    act({ component: "modal" }), // 7th action: over the limit of 6
  ]);
  expect(e.components).toEqual(["toast"]);
  expect(e.colors).toEqual([{ hex: "#123456", name: "b evil /b name", note: "" }]);
});

test("fonts come only from the allowlist, one per role", () => {
  let e = applyActions(emptyExtras, [act({ type: "set_font", font: "Sora", role: "display" }), act({ type: "set_font", font: "Comic Sans" as never, role: "body" }), act({ type: "set_font", font: "Inter", role: "body" })]);
  expect(e.fonts).toEqual([{ family: "Sora", role: "display" }, { family: "Inter", role: "body" }]);
  e = applyActions(e, [act({ type: "set_font", font: "Syne", role: "display" }), act({ type: "remove_font", role: "body" })]);
  expect(e.fonts).toEqual([{ family: "Syne", role: "display" }]);
  // Boards saved before fonts existed have no fonts field.
  expect(applyActions({ components: [], colors: [] }, [act({ type: "set_font", font: "Sora", role: "body" })]).fonts).toEqual([{ family: "Sora", role: "body" }]);
});

test("design system: made by Scout, tweaks kept in range", () => {
  expect(applyActions(emptyExtras, [act({ type: "make_system" })]).system).toEqual({});
  const e = applyActions(emptyExtras, [act({ type: "set_type_scale", value: 1.333 }), act({ type: "set_spacing", value: 8 }), act({ type: "set_radius", value: 12 })]);
  expect(e.system).toEqual({ ratio: 1.333, spacing: 8, radius: 12 });
  expect(applyActions(e, [act({ type: "set_type_scale", value: 9 }), act({ type: "set_spacing", value: 5 }), act({ type: "set_radius", value: -3 })]).system).toEqual(e.system);
  expect(applyActions(emptyExtras, [act({ component: "toast" })]).system).toBeUndefined();
  expect(parseAskRequest({ keyword: "ab", request: "hi there", palette: [], extras: { components: [], colors: [], system: { ratio: 99, spacing: 8 } } })!.extras.system).toEqual({ spacing: 8 });
});

test("the request from the browser is validated", () => {
  const ok = { keyword: "liquid glass", request: "add a pricing card", summary: "s", typeTraits: "rounded sans", palette: ["#D4D6DC"], extras: { components: ["toast", "nope"], colors: [{ hex: "#ABCDEF", name: "a" }, { hex: "bad" }], fonts: [{ family: "Sora", role: "display" }, { family: "Comic Sans", role: "body" }] } };
  expect(parseAskRequest(ok)).toEqual({ ...ok, extras: { components: ["toast"], colors: [{ hex: "#ABCDEF", name: "a", note: "" }], fonts: [{ family: "Sora", role: "display" }] } });
  expect(parseAskRequest({ ...ok, request: "x" })).toBeNull();
  expect(parseAskRequest({ ...ok, request: "x".repeat(201) })).toBeNull();
  expect(parseAskRequest({ ...ok, palette: ["url(javascript:1)"] })).toBeNull();
  expect(parseAskRequest({ ...ok, keyword: "" })).toBeNull();
});

test("askScout sends the catalog and reads the structured answer", async () => {
  let sent: Record<string, unknown> = {};
  const send = async (b: Record<string, unknown>) => {
    sent = b;
    return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ reply: "Added a toast.", actions: [act({ component: "toast" })] }) } }], usage: { cost: 0.0004, prompt_tokens: 900, completion_tokens: 60 } };
  };
  const r = await askScout({ keyword: "liquid glass", request: "add a toast", summary: "", typeTraits: "", palette: [], extras: emptyExtras }, send);
  expect(JSON.stringify(sent.messages)).toContain("pricing (Pricing card)");
  expect(r.answer.actions[0].component).toBe("toast");
  expect(r.usage.usd).toBe(0.0004);
});
