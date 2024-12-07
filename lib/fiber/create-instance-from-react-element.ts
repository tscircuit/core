import type React from "react"
import ReactReconciler, { type HostConfig } from "react-reconciler"
import { type Renderable } from "lib/components/base-components/Renderable"
import { type NormalComponent } from "lib/components/base-components/NormalComponent"
import type { ReactElement, ReactNode } from "react"
import { catalogue, type Instance } from "./catalogue"
import { identity } from "transformation-matrix"

export type ReactSubtree = {
  element: ReactElement // TODO rename to "reactElement"
  component: NormalComponent
}

// biome-ignore lint/suspicious/noEmptyInterface: TODO when we have local state
interface LocalState {}

export function prepare<T extends Renderable>(
  object: T,
  state?: Partial<LocalState>,
): Instance {
  const instance = object as unknown as Instance
  instance.__tsci = {
    ...state,
  }

  return object
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
  createInstance(type: string, props: any) {
    const target = catalogue[type]

    if (!target) {
      if (Object.keys(catalogue).length === 0) {
        throw new Error(
          "No components registered in catalogue, did you forget to import lib/register-catalogue in your test file?",
        )
      }
      throw new Error(
        `Unsupported component type (not registered in @tscircuit/core catalogue): "${type}" See CREATING_NEW_COMPONENTS.md`,
      )
    }

    const instance = prepare(new target(props) as any, {})

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
    return instance
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
  reactElm: React.JSX.Element,
): NormalComponent => {
  const rootContainer = {
    children: [] as any[],
    props: {
      name: "$root",
    },
    add(instance: any) {
      instance.parent = this
      this.children.push(instance)
    },
    computePcbGlobalTransform() {
      return identity()
    },
  }
  const container = reconciler.createContainer(
    // TODO Replace with store like react-three-fiber
    // https://github.com/pmndrs/react-three-fiber/blob/a457290856f57741bf8beef4f6ff9dbf4879c0a5/packages/fiber/src/core/index.tsx#L172
    // https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/store.ts#L168
    rootContainer,
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
  const rootInstance = reconciler.getPublicRootInstance(
    container,
  ) as NormalComponent
  if (rootInstance) return rootInstance
  return rootContainer.children[0] as NormalComponent
}
