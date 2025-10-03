try {
  require("bun-match-svg")
} catch (e) {
  console.warn("Warning: bun-match-svg not available")
}

try {
  require("./extend-expect-any-svg")
} catch (e) {
  console.warn("Warning: SVG testing not available due to sharp dependency")
}

import "lib/register-catalogue"
import "./preload-debug-output-dump"
import "./preload-server-cleanup"

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchInlineSnapshot(snapshot?: string | null): Promise<MatcherResult>
  }
}
