import type React from "react"
import { Project } from "lib/Project"
import ReactReconciler, { type HostConfig } from "react-reconciler"
import { type NormalComponent } from "lib/components"
import type { ReactElement, ReactNode } from "react"

export type ReactSubtree = {
  element: ReactElement
  component: NormalComponent
}

// Define the host config
const hostConfig: HostConfig<
  string | NormalComponent,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
> = {
  supportsMutation: true,
  createInstance(type: string | NormalComponent, props: any) {
    console.log(type)
    switch (type) {
      default:
        throw new Error(`Unsupported component type: ${type}`)
    }
  },
  createTextInstance() {
    // We don't need to handle text nodes for this use case
    return {}
  },
  appendInitialChild(parentInstance: any, child: any) {
    parentInstance.add(child)
  },
  appendChild(parentInstance: any, child: any) {
    parentInstance.add(child)
  },
  finalizeInitialChildren() {
    return false
  },
  prepareUpdate() {
    return null
  },
  shouldSetTextContent() {
    return false
  },
  getRootHostContext() {
    return {}
  },
  getChildHostContext() {
    return {}
  },
  prepareForCommit() {
    return null
  },
  resetAfterCommit() {},
  commitMount() {},
  commitUpdate() {},
  removeChild() {},
  clearContainer() {},
  supportsPersistence: false,
  getPublicInstance: function (instance: any) {
    throw new Error("Function not implemented.")
  },
  preparePortalMount: function (containerInfo: any): void {
    throw new Error("Function not implemented.")
  },
  scheduleTimeout: function (
    fn: (...args: unknown[]) => unknown,
    delay?: number,
  ) {
    throw new Error("Function not implemented.")
  },
  cancelTimeout: function (id: any): void {
    throw new Error("Function not implemented.")
  },
  noTimeout: undefined,
  isPrimaryRenderer: false,
  getCurrentEventPriority: function (): ReactReconciler.Lane {
    throw new Error("Function not implemented.")
  },
  getInstanceFromNode: function (
    node: any,
  ): ReactReconciler.Fiber | null | undefined {
    throw new Error("Function not implemented.")
  },
  beforeActiveInstanceBlur: function (): void {
    throw new Error("Function not implemented.")
  },
  afterActiveInstanceBlur: function (): void {
    throw new Error("Function not implemented.")
  },
  prepareScopeUpdate: function (scopeInstance: any, instance: any): void {
    throw new Error("Function not implemented.")
  },
  getInstanceFromScope: function (scopeInstance: any) {
    throw new Error("Function not implemented.")
  },
  detachDeletedInstance: function (node: any): void {
    throw new Error("Function not implemented.")
  },
  supportsHydration: false,
}

const reconciler = ReactReconciler(hostConfig as any)

export const createReactSubtree = (
  reactElm: React.ReactElement,
): NormalComponent => {
  const container = reconciler.createContainer(
    null,
    0,
    null,
    false,
    null,
    "tsci",
    (error: Error) => {
      console.log("Error in createContainer")
      console.error(error)
    },
    null,
  )
  reconciler.updateContainer(reactElm, container, null, () => {})
  return reconciler.getPublicRootInstance(container) as NormalComponent
}
