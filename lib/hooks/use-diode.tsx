import { diodePins, type DiodeProps } from "@tscircuit/props"
import { createUseComponent } from "./create-use-component"

interface ExtendedDiodeProps extends DiodeProps {
  direction?: 'right' | 'left' | 'up' | 'down';
}

export const useDiode = createUseComponent(
  (props: ExtendedDiodeProps) => <diode {...props} />,
  diodePins,
)