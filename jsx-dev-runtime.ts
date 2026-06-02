export { Fragment, jsxDEV } from "react/jsx-dev-runtime"

import type * as React from "react"
import type { TscircuitElements } from "./lib/fiber/intrinsic-jsx"

export namespace JSX {
  export type ElementType = string | React.JSXElementConstructor<any>
  export interface Element extends React.ReactElement<any, any> {}
  export interface IntrinsicAttributes extends React.Attributes {}
  export interface IntrinsicElements extends TscircuitElements {}
}
