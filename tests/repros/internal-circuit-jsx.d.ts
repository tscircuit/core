import type { InternalCircuitProps } from "@tscircuit/props"

declare module "lib/fiber/intrinsic-jsx" {
  interface TscircuitElements {
    internalcircuit: InternalCircuitProps
  }
}
