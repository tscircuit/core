import type {
  SystemBlockPageProps,
  SystemBlockGroupProps,
  SystemBlockComponentProps,
  SystemBlockConnectionProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

export const systemblock = {
  page: createNamespacedElement<SystemBlockPageProps>("systemblockpage"),
  group: createNamespacedElement<SystemBlockGroupProps>("systemblockgroup"),
  component: createNamespacedElement<SystemBlockComponentProps>(
    "systemblockcomponent",
  ),
  connection: createNamespacedElement<SystemBlockConnectionProps>(
    "systemblockconnection",
  ),
} as const
