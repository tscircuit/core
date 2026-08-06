import type { PlatformConfig } from "@tscircuit/props"

export interface CorePlatformConfig extends PlatformConfig {
  /**
   * Maximum time, in milliseconds, that an individual PCB pack solver may run.
   * The timeout is checked between solver steps.
   */
  pcbPackSolverTimeoutMs?: number
}
