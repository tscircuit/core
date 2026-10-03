import type {
  AssemblyDevicePropsInput,
  AssemblyMotorPropsInput,
  AssemblyScreenPropsInput,
  AssemblySubassemblyPropsInput,
} from "@tscircuit/props"
import type { ReactNode } from "react"
import { createNamespacedElement } from "./create-namespaced-element"

export interface AssemblyDeviceJsxProps extends AssemblyDevicePropsInput {
  children?: ReactNode
}

export interface AssemblyScreenJsxProps extends AssemblyScreenPropsInput {}

export interface AssemblyMotorJsxProps extends AssemblyMotorPropsInput {}

export interface AssemblySubassemblyJsxProps
  extends AssemblySubassemblyPropsInput {}
export type AssemblyCadAssemblyJsxProps = AssemblySubassemblyJsxProps

export const assembly = {
  motor: createNamespacedElement<AssemblyMotorJsxProps>("assembly.motor"),
  subassembly: createNamespacedElement<AssemblySubassemblyJsxProps>(
    "assembly.subassembly",
  ),
  cadassembly: createNamespacedElement<AssemblySubassemblyJsxProps>(
    "assembly.cadassembly",
  ),
  device: createNamespacedElement<AssemblyDeviceJsxProps>("assembly.device"),
  screen: createNamespacedElement<AssemblyScreenJsxProps>("assembly.screen"),
} as const
