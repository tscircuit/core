import "./extend-expect-any-svg"
import "./simulation-matcher"
import "lib/register-catalogue"
import { mock } from "bun:test"
import * as core from "lib"

// Part packages import "tscircuit" for its JSX types. Resolve it to the core under
// test instead of the published bundle, which pins its own props version.
mock.module("tscircuit", () => core)
import "./preload-debug-output-dump"
import "./preload-server-cleanup"

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchInlineSnapshot(snapshot?: string | null): Promise<MatcherResult>
  }
}
