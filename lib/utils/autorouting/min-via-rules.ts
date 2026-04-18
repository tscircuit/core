import { distance } from "circuit-json"

export type MinViaRuleProps = {
  minViaDiameter?: number | string
  minViaHole?: number | string
}

export const getMinViaRuleValues = (props?: MinViaRuleProps) => ({
  minViaDiameter:
    props?.minViaDiameter != null ? distance.parse(props.minViaDiameter) : null,
  minViaHole:
    props?.minViaHole != null ? distance.parse(props.minViaHole) : null,
})
