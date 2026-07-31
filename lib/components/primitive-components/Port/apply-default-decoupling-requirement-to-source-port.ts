import type { SourcePort } from "circuit-json"
import { POWER_NET_REGEX } from "lib/utils/gnd-power-net-regex"

export const applyDefaultDecouplingRequirementToSourcePort = ({
  sourcePortAttributes,
  sourcePortLabels,
  parentNormalComponentName,
}: {
  sourcePortAttributes: Partial<SourcePort>
  sourcePortLabels: string[]
  parentNormalComponentName: string | undefined
}): void => {
  if (parentNormalComponentName !== "Chip") return
  if (sourcePortAttributes.should_have_decoupling_capacitor !== undefined) {
    return
  }

  if (sourcePortAttributes.provides_power === true) {
    sourcePortAttributes.should_have_decoupling_capacitor = false
    return
  }

  if (sourcePortAttributes.requires_power !== undefined) {
    sourcePortAttributes.should_have_decoupling_capacitor =
      sourcePortAttributes.requires_power
    return
  }

  if (
    sourcePortLabels.some((sourcePortLabel) =>
      POWER_NET_REGEX.test(sourcePortLabel),
    )
  ) {
    sourcePortAttributes.should_have_decoupling_capacitor = true
  }
}
