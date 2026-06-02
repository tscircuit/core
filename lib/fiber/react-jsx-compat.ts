import type * as Props from "@tscircuit/props"
import type { TscircuitElements } from "./intrinsic-jsx"

type TscircuitElementsWithoutReactConflicts = Omit<TscircuitElements, "switch">
type SwitchSvgAttributeProps = Partial<
  Omit<Props.SwitchProps, "children" | "type">
>

declare module "react" {
  interface SVGAttributes<T> extends SwitchSvgAttributeProps {}

  namespace JSX {
    interface IntrinsicElements
      extends TscircuitElementsWithoutReactConflicts {}
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements
      extends TscircuitElementsWithoutReactConflicts {}
  }
}
