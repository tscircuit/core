import type * as Props from "@tscircuit/props"
import type { TscircuitElements } from "./intrinsic-jsx"

type TscircuitElementsWithoutReactConflicts = Omit<TscircuitElements, "switch">
type SwitchSvgAttributeProps = Partial<
  Omit<Props.SwitchProps, "children" | "type">
>
// <symbol> is typed as React's SVG symbol element; its tscircuit-only props are added the same way
type SymbolSvgAttributeProps = Partial<
  Pick<Props.SymbolProps, "objectFit" | "viewbox" | "viewboxPreset">
>

declare module "react" {
  interface SVGAttributes<T>
    extends SwitchSvgAttributeProps,
      SymbolSvgAttributeProps {}

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
