import type { ChipProps } from "@tscircuit/props"
import { createUseComponent, type PinLabelSpec } from "./create-use-component"

export const useChip = <PinLabel extends string>(
  pinLabels: PinLabelSpec<PinLabel>,
) => createUseComponent((props: ChipProps) => <chip {...props} />, pinLabels)
