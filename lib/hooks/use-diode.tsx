import { diodePins, type DiodeProps } from "@tscircuit/props"
import { createUseComponent } from "./create-use-component"

export const useDiode = createUseComponent(
  (props: DiodeProps) => <diode {...props} />,
  diodePins,
 )
