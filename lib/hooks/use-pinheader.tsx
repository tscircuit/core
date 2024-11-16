import type { PinHeaderProps } from "@tscircuit/props"
import { createUseComponent } from "./create-use-component"

export const usePinHeader = (pinLabels: string[]) =>
  createUseComponent(
    (props: PinHeaderProps) => <pinheader pinLabels={pinLabels} {...props} />,
    pinLabels,
  )
