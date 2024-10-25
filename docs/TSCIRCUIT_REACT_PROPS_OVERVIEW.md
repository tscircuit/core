# @tscircuit/props Overview

> Generated at 2024-10-24T23:36:55.414Z

This document provides an overview of all the prop types available in @tscircuit/props.
Each interface has a corresponding zod validator that can be imported from the package.

For example, for `ChipProps` there is a `chipProps` zod validator:

```ts
import { chipProps, type ChipProps } from "@tscircuit/props"

// Validate/parse props
const validatedProps = chipProps.parse(unknownProps)
```

## Available Props

```ts
export interface JumperProps extends CommonComponentProps {
  manufacturerPartNumber?: string
  pinLabels?: Record<number | string, string>
  schPinStyle?: SchematicPinStyle
  schPinSpacing?: number | string
  schWidth?: number | string
  schHeight?: number | string
  schDirection?: "left" | "right"
  schPortArrangement?: SchematicPortArrangement
}


export interface ResistorProps extends CommonComponentProps {
  resistance: number | string
  pullupFor?: string
  pullupTo?: string
  pulldownFor?: string
  pulldownTo?: string
}


export interface CirclePlatedHoleProps
  extends Omit<PcbLayoutProps, "pcbRotation" | "layer"> {
  name?: string
  shape: "circle"
  holeDiameter: number | string
  outerDiameter: number | string
  portHints?: PortHints
}


export interface OvalPlatedHoleProps
  extends Omit<PcbLayoutProps, "pcbRotation" | "layer"> {
  name?: string
  shape: "oval"
  outerWidth: number | string
  outerHeight: number | string
  innerWidth: number | string
  innerHeight: number | string
  portHints?: PortHints
}


export interface PillPlatedHoleProps
  extends Omit<PcbLayoutProps, "pcbRotation" | "layer"> {
  name?: string
  shape: "pill"
  outerWidth: number | string
  outerHeight: number | string
  innerWidth: number | string
  innerHeight: number | string
  portHints?: PortHints
}


export interface BaseGroupProps extends CommonLayoutProps {
  name?: string
  children?: any
}


export interface SubcircuitGroupProps extends BaseGroupProps {
  subcircuit: true
  layout?: LayoutBuilder
  routingDisabled?: boolean
  defaultTraceWidth?: Distance

  /**
   * If true, we'll automatically layout the schematic for this group. Must be
   * a subcircuit (currently). This is eventually going to be replaced with more
   * sophisticated layout options/modes and will be enabled by default.
   */
  schAutoLayoutEnabled?: boolean
}


export interface RectSolderPasteProps
  extends Omit<PcbLayoutProps, "pcbRotation"> {
  shape: "rect"
  width: Distance
  height: Distance
}


export interface CircleSolderPasteProps
  extends Omit<PcbLayoutProps, "pcbRotation"> {
  shape: "circle"
  radius: Distance
}


export interface CapacitorProps extends CommonComponentProps {
  capacitance: number | string

  decouplingFor?: string
  decouplingTo?: string

  bypassFor?: string
  bypassTo?: string
}


export interface RectSmtPadProps extends Omit<PcbLayoutProps, "pcbRotation"> {
  shape: "rect"
  width: Distance
  height: Distance
  portHints?: PortHints
}


export interface CircleSmtPadProps extends Omit<PcbLayoutProps, "pcbRotation"> {
  shape: "circle"
  radius: Distance
  portHints?: PortHints
}


export interface NetProps {
  name: string
}


export interface ChipProps extends CommonComponentProps {
  manufacturerPartNumber?: string
  pinLabels?: Record<number | string, string | string[]>
  schPortArrangement?: SchematicPortArrangement
  schPinStyle?: SchematicPinStyle
  schPinSpacing?: Distance
  schWidth?: Distance
  schHeight?: Distance
}


export interface BatteryProps extends CommonComponentProps {
  capacity?: number | string
}


export interface FootprintProps {
  /**
   * The layer that the footprint is designed for. If you set this to "top"
   * then it means the children were intended to represent the top layer. If
   * the <chip /> with this footprint is moved to the bottom layer, then the
   * components will be mirrored.
   *
   * Generally, you shouldn't set this except where it can help prevent
   * confusion because you have a complex multi-layer footprint. Default is
   * "top" and this is most intuitive.
   */
  originalLayer?: LayerRef
}


export interface HoleProps extends Omit<PcbLayoutProps, "pcbRotation"> {
  name?: string
  diameter?: Distance
  radius?: Distance
}


export interface ConstrainedLayoutProps {
  name?: string
  pcbOnly?: boolean
  schOnly?: boolean
}


export interface BoardProps {
  width?: number | string
  height?: number | string
  outline?: Point[]
  pcbX?: number | string
  pcbY?: number | string
  layout?: any
  routingDisabled?: boolean
  children?: any
  defaultTraceWidth?: Distance
  /**
   * If true, we'll automatically layout the schematic for this group. Must be
   * a subcircuit (currently). This is eventually going to be replaced with more
   * sophisticated layout options/modes and will be enabled by default.
   */
  schAutoLayoutEnabled?: boolean
}


export interface CadModelBase {
  rotationOffset?:
    | number
    | { x: number | string; y: number | string; z: number | string }
  positionOffset?: {
    x: number | string
    y: number | string
    z: number | string
  }
  size?: { x: number | string; y: number | string; z: number | string }
}


export interface CadModelStl extends CadModelBase {
  stlUrl: string
}


export interface CadModelObj extends CadModelBase {
  objUrl: string
  mtlUrl?: string
}


export interface CadModelJscad extends CadModelBase {
  jscad: Record<string, any>
}


export interface PcbLayoutProps {
  pcbX?: string | number
  pcbY?: string | number
  pcbRotation?: string | number
  layer?: LayerRefInput
}


export interface CommonLayoutProps {
  pcbX?: string | number
  pcbY?: string | number
  pcbRotation?: string | number

  schX?: string | number
  schY?: string | number
  schRotation?: string | number

  layer?: LayerRefInput
  footprint?: Footprint
}


export interface SupplierProps {
  supplierPartNumbers?: { [k in SupplierName]?: string[] }
}


export interface CommonComponentProps extends CommonLayoutProps {
  key?: any
  name: string
  supplierPartNumbers?: SupplierProps["supplierPartNumbers"]
  cadModel?: CadModelProp
  children?: any
  symbolName?: string
}


export interface SchematicPortArrangementWithSizes {
  leftSize?: number
  topSize?: number
  rightSize?: number
  bottomSize?: number
}


export interface SchematicPortArrangementWithPinCounts {
  leftPinCount?: number
  topPinCount?: number
  rightPinCount?: number
  bottomPinCount?: number
}


export interface PinSideDefinition {
  pins: number[]
  direction:
    | "top-to-bottom"
    | "left-to-right"
    | "bottom-to-top"
    | "right-to-left"
}


export interface SchematicPortArrangementWithSides {
  leftSide?: PinSideDefinition
  topSide?: PinSideDefinition
  rightSide?: PinSideDefinition
  bottomSide?: PinSideDefinition
}

```
