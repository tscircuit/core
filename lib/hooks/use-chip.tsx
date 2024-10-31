import type { ChipProps } from "@tscircuit/props"
import { createUseComponent, type PinLabelSpec } from "./create-use-component"

export const useChip = <PinLabel extends string>(
  pinLabels: Record<string, PinLabel[]>,
) =>
  createUseComponent(
    (props: ChipProps) => <chip pinLabels={pinLabels} {...props} />,
    pinLabels,
  )
