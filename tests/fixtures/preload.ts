import "bun-match-svg"
import "./extend-expect-any-svg"
import "./simulation-matcher"
import "lib/register-catalogue"
import "./preload-debug-output-dump"
import "./preload-server-cleanup"
import "./register-static-asset-loaders"

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchInlineSnapshot(snapshot?: string | null): Promise<MatcherResult>
  }
}
