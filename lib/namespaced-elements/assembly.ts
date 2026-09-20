import type {
  AssemblyDevicePropsInput,
  AssemblyScreenPropsInput,
} from "@tscircuit/props"
import type { ReactNode } from "react"
import { createNamespacedElement } from "./create-namespaced-element"

export interface AssemblyDeviceJsxProps extends AssemblyDevicePropsInput {
  children?: ReactNode
}

export interface AssemblyScreenJsxProps extends AssemblyScreenPropsInput {}

export const assembly = {
  device: createNamespacedElement<AssemblyDeviceJsxProps>("assembly.device"),
  screen: createNamespacedElement<AssemblyScreenJsxProps>("assembly.screen"),
} as const
