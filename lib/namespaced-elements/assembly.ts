import type { AssemblyDevicePropsInput } from "@tscircuit/props"
import type { ReactNode } from "react"
import { createNamespacedElement } from "./create-namespaced-element"

export interface AssemblyDeviceJsxProps extends AssemblyDevicePropsInput {
  children?: ReactNode
}

export const assembly = {
  device: createNamespacedElement<AssemblyDeviceJsxProps>("assembly.device"),
} as const
