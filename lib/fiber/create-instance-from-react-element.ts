/**
 * This is how we render in React. This can be a confusing part of the codebase,
 * but here are some helpful reference implementations:
 *
 * https://github.com/diegomura/react-pdf/blob/fabecc56727dfb6d590a3fa1e11f50250ecbbea1/packages/reconciler/src/reconciler-31.js
 * https://github.com/pmndrs/react-three-fiber/blob/ec4f00bb61cc4f6e28b3a12b1dca9daa5594f10e/packages/fiber/src/core/renderer.ts
 *
 *
 */
import React from "react"
import ReactReconciler, { type HostConfig } from "react-reconciler"
// @ts-expect-error
import ReactReconciler18 from "react-reconciler-18"
import { DefaultEventPriority } from "react-reconciler/constants.js"
import { type Renderable } from "lib/components/base-components/Renderable"
import { type NormalComponent } from "lib/components/base-components/NormalComponent"
import type { ReactElement, ReactNode } from "react"
import { catalogue, type Instance } from "./catalogue"
import { identity } from "transformation-matrix"
import type { RootCircuit } from "lib/RootCircuit"
import { createErrorPlaceholderComponent } from "lib/components/primitive-components/ErrorPlaceholder"

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

    try {
      const instance = prepare(new target(props) as any, {})
      return instance
    } catch (error) {
      return createErrorPlaceholderComponent(props, error)
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

  // https://github.com/pmndrs/react-three-fiber/pull/2360#discussion_r916356874
  getCurrentEventPriority: () => DefaultEventPriority,

  // @ts-expect-error
  // https://github.com/diegomura/react-pdf/blob/fabecc56727dfb6d590a3fa1e11f50250ecbbea1/packages/reconciler/src/reconciler-31.js#L57
  getCurrentUpdatePriority: () => DefaultEventPriority,
  resolveUpdatePriority: () => DefaultEventPriority,
  setCurrentUpdatePriority: () => {},
  maySuspendCommit: () => false,

  supportsHydration: false,
}

let reconciler: ReturnType<typeof ReactReconciler>
if (React.version.startsWith("19.")) {
  reconciler = ReactReconciler(hostConfig as any)
} else {
  // React 18 support
  reconciler = ReactReconciler18(hostConfig as any)
}

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
  const containerErrors: Error[] = []
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
      containerErrors.push(error)
    },
    null,
  )

  if (React.version.startsWith("19.")) {
    // @ts-expect-error
    // https://github.com/diegomura/react-pdf/blob/fabecc56727dfb6d590a3fa1e11f50250ecbbea1/packages/reconciler/src/reconciler-31.js#L78
    reconciler.updateContainerSync(reactElm, container, null, () => {})
    // @ts-expect-error
    // https://github.com/diegomura/react-pdf/blob/fabecc56727dfb6d590a3fa1e11f50250ecbbea1/packages/reconciler/src/reconciler-31.js#L78
    reconciler.flushSyncWork()
  } else {
    // React 18 support
    reconciler.updateContainer(reactElm, container, null, () => {})
  }

  // Don't throw here if you want to avoid synchronous errors
  if (containerErrors.length > 0) {
    throw containerErrors[0]
  }

  const rootInstance = reconciler.getPublicRootInstance(
    container,
  ) as NormalComponent
  if (rootInstance) return rootInstance
  return rootContainer.children[0] as NormalComponent
}
