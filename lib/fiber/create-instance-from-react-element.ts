import type React from "react"
import ReactReconciler, { type HostConfig } from "react-reconciler"
import { type NormalComponent } from "lib/components"
import type { ReactElement, ReactNode } from "react"

export type ReactSubtree = {
  element: ReactElement
  component: NormalComponent
}

export type Instance = {
  // Add any universal methods for classes, e.g. ".add"
} & { [key: string]: any }

export interface Catalogue {
  [name: string]: {
    new (...args: any): Instance
  }
}

export const catalogue: Catalogue = {}
export const extendCatalogue = (objects: object): void =>
  void Object.assign(catalogue, objects)

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
  createInstance(type: string, props: any) {
    const classDef = catalogue[type]

    if (!classDef) {
      if (Object.keys(catalogue).length === 0) {
        throw new Error(
          "No components registered in catalogue, did you forget to import lib/register-catalogue in your test file?",
        )
      }
      throw new Error(
        `Unsupported component type (not registered in @tscircuit/core catalogue): ${type}`,
      )
    }

    const instance = new classDef(props)

    return instance
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
  appendChildToContainer(container: any, child: any) {
    container.add(child)
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
  getPublicInstance(instance: any) {
    throw new Error("Function not implemented.")
  },
  preparePortalMount(containerInfo: any): void {
    throw new Error("Function not implemented.")
  },
  scheduleTimeout(fn: (...args: unknown[]) => unknown, delay?: number) {
    throw new Error("Function not implemented.")
  },
  cancelTimeout(id: any): void {
    throw new Error("Function not implemented.")
  },
  noTimeout: undefined,
  isPrimaryRenderer: false,
  getCurrentEventPriority(): ReactReconciler.Lane {
    throw new Error("Function not implemented.")
  },
  getInstanceFromNode(node: any): ReactReconciler.Fiber | null | undefined {
    throw new Error("Function not implemented.")
  },
  beforeActiveInstanceBlur(): void {
    throw new Error("Function not implemented.")
  },
  afterActiveInstanceBlur(): void {
    throw new Error("Function not implemented.")
  },
  prepareScopeUpdate: (scopeInstance: any, instance: any): void => {
    throw new Error("Function not implemented.")
  },
  getInstanceFromScope: (scopeInstance: any) => {
    throw new Error("Function not implemented.")
  },
  detachDeletedInstance: (node: any): void => {
    throw new Error("Function not implemented.")
  },
  supportsHydration: false,
}

const reconciler = ReactReconciler(hostConfig as any)

export const createInstanceFromReactElement = (
  reactElm: React.ReactElement,
): NormalComponent => {
  const container = reconciler.createContainer(
    // TODO Replace with store like react-three-fiber
    // https://github.com/pmndrs/react-three-fiber/blob/a457290856f57741bf8beef4f6ff9dbf4879c0a5/packages/fiber/src/core/index.tsx#L172
    // https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/store.ts#L168
    {
      props: {
        name: "$root",
      },
      add(instance: any) {
        instance.parent = this
      },
    },
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
