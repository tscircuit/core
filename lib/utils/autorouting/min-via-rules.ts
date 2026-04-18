import { distance } from "circuit-json"
import { z } from "zod"

export const minViaRuleProps = {
  minViaDiameter: z.number().or(z.string()).optional(),
  minViaHole: z.number().or(z.string()).optional(),
}

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
