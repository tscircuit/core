// Temporary preload file without sharp dependency
import "lib/register-catalogue"

// Skip the extends that depend on sharp for now
console.log("Skipping sharp-dependent imports for test execution")

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchInlineSnapshot(snapshot?: string | null): Promise<MatcherResult>
    toMatchSchematicSnapshot(testPath: string): Promise<MatcherResult>
  }
}