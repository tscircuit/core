import type { PreflightRoutingCheckPolicy } from "@tscircuit/props"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export function resolvePreflightRoutingCheckPolicy(
  component: PrimitiveComponent,
  phasePolicy?: PreflightRoutingCheckPolicy,
): PreflightRoutingCheckPolicy | undefined {
  if (phasePolicy !== undefined) return phasePolicy
  let ancestor: PrimitiveComponent | null = component
  while (ancestor) {
    const policy = ancestor._parsedProps?.preflightRoutingCheckPolicy
    if (policy !== undefined) return policy
    ancestor = ancestor.parent as PrimitiveComponent | null
  }
  return undefined
}
