import { parseConnectorString } from "@tscircuit/cableprinter"
import type { ParsedConnectorProps } from "@tscircuit/props"

/** Recover a physical mating interface without treating its model family as a standard. */
export function resolveConnectorModelProps(
  props: ParsedConnectorProps,
): ParsedConnectorProps {
  if (!props.modelprinterString) return props
  // Modelprinter supports many non-connector models. Only decode known cable
  // interfaces here; preserve other model specifications for CAD consumers.
  if (
    !/^(bullet[0-9]*_|jst_(sh|ph)(_|$)|usb_c$)/i.test(props.modelprinterString)
  )
    return props
  const connector = parseConnectorString(props.modelprinterString)
  if (connector.kind === "bullet_male" || connector.kind === "bullet_female") {
    return {
      ...props,
      standard: "bullet",
      bulletDiameter: connector.diameter,
      bulletGender: connector.kind === "bullet_male" ? "male" : "female",
      pinCount: connector.pinCount,
    }
  }
  if (
    connector.kind === "jst_sh_housing" ||
    connector.kind === "jst_ph_housing"
  ) {
    return {
      ...props,
      standard: connector.kind === "jst_sh_housing" ? "jst_sh" : "jst_ph",
      pinCount: connector.pinCount,
    }
  }
  if (connector.kind === "usb_c_plug") return { ...props, standard: "usb_c" }
  return props
}
