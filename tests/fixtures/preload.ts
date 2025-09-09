import "bun-match-svg"
import "./extend-expect-any-svg"
import "lib/register-catalogue"

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchInlineSnapshot(snapshot?: string | null): Promise<MatcherResult>
  }
}
