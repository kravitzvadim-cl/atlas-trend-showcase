import { expect, test } from "vitest";
import { isAuthorized } from "./auth";

const basic = (user: string, pass: string) => "Basic " + btoa(`${user}:${pass}`);

test("no password configured means the site is open (local development)", () => {
  expect(isAuthorized(null, undefined)).toBe(true);
});

test("the right password lets you in, whatever the username", () => {
  expect(isAuthorized(basic("recruiter", "s3cret-pass"), "s3cret-pass")).toBe(true);
});

test("a wrong, missing or malformed password is refused", () => {
  expect(isAuthorized(basic("x", "nope"), "s3cret-pass")).toBe(false);
  expect(isAuthorized(null, "s3cret-pass")).toBe(false);
  expect(isAuthorized("Bearer abc", "s3cret-pass")).toBe(false);
  expect(isAuthorized("Basic %%%", "s3cret-pass")).toBe(false);
});
