import type { PinHeaderProps } from "@tscircuit/props"
import { createUseComponent } from "./create-use-component"

export const usePinHeader = (
  name: string,
  PinHeaderProps: {
    pinLabels: PinHeaderProps["pinLabels"]
  },
) =>
  createUseComponent(
    (props: PinHeaderProps) => (
      <pinheader {...props} name={name} pinLabels={PinHeaderProps.pinLabels} />
    ),
    PinHeaderProps.pinLabels!,
  )
