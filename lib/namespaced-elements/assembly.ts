import type {
  AssemblyDevicePropsInput,
  AssemblyScreenPropsInput,
  AssemblySubassemblyPropsInput,
} from "@tscircuit/props"
import type { ReactNode } from "react"
import { createNamespacedElement } from "./create-namespaced-element"

export interface AssemblyDeviceJsxProps extends AssemblyDevicePropsInput {
  children?: ReactNode
}

export interface AssemblyScreenJsxProps extends AssemblyScreenPropsInput {}

export interface AssemblySubassemblyJsxProps
  extends Omit<AssemblySubassemblyPropsInput, "connectsTo"> {}
export type AssemblyCadAssemblyJsxProps = AssemblySubassemblyJsxProps

export const assembly = {
  subassembly: createNamespacedElement<AssemblySubassemblyJsxProps>(
    "assembly.subassembly",
  ),
  cadassembly: createNamespacedElement<AssemblySubassemblyJsxProps>(
    "assembly.cadassembly",
  ),
  device: createNamespacedElement<AssemblyDeviceJsxProps>("assembly.device"),
  screen: createNamespacedElement<AssemblyScreenJsxProps>("assembly.screen"),
} as const
