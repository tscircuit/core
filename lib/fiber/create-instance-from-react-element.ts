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
import * as Effect from "effect/Effect"
import { coreSync, runCoreSync, type CoreError } from "lib/effect/core-error"
import { dispatchComponentAdditionEffect } from "lib/effect/component-model-tree"
import ReactReconciler, { type HostConfig } from "react-reconciler"
import { DefaultEventPriority } from "react-reconciler/constants.js"
import { type Renderable } from "lib/components/base-components/Renderable"
import { type NormalComponent } from "lib/components/base-components/NormalComponent"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { ReactElement, ReactNode } from "react"
import { catalogue, type Instance } from "./catalogue"
import { identity } from "transformation-matrix"
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
  return runCoreSync(prepareInstanceEffect(object, state))
}

export function prepareInstanceEffect<T extends Instance>(
  instance: T,
  state?: Partial<LocalState>,
) {
  return coreSync(
    () => Object.assign(instance, { __tsci: { ...state } }),
    "prepare_react_host_instance",
  )
}

/** React's synchronous host callback runs this native construction program. */
export function createCatalogueInstanceEffect(
  type: string,
  props: object,
): Effect.Effect<PrimitiveComponent, CoreError> {
  return Effect.gen(function* () {
    const target = yield* coreSync(() => {
      const constructor = catalogue[type]
      if (constructor) return constructor
      if (Object.keys(catalogue).length === 0) {
        throw new Error(
          "No components registered in catalogue, did you forget to import lib/register-catalogue in your test file?",
        )
      }
      throw new Error(
        `Unsupported component type "${type}". No element with this name is registered in the @tscircuit/core catalogue. ` +
          `Check for typos or see https://docs.tscircuit.com/category/built-in-elements for a list of valid components. ` +
          `To add your own component, see docs/CREATING_NEW_COMPONENTS.md`,
      )
    }, "lookup_react_component_constructor")
    return yield* Effect.catch(
      Effect.flatMap(
        coreSync(
          () => new target(props) as PrimitiveComponent,
          "construct_react_component",
        ),
        (instance) => prepareInstanceEffect(instance, {}),
      ),
      (failure) =>
        coreSync(
          () =>
            createErrorPlaceholderComponent(
              { ...props, componentType: type },
              failure.cause,
            ),
          "create_invalid_component_placeholder",
        ),
    )
  })
}

type ReactHostParent = {
  add(child: Instance): void
  addEffect?(child: Instance): Effect.Effect<void, unknown>
}

function appendReactChildEffect(parent: ReactHostParent, child: Instance) {
  return dispatchComponentAdditionEffect({ parent, child })
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
    return runCoreSync(createCatalogueInstanceEffect(type, props))
  },
  createTextInstance(text: string) {
    // Preserve the raw text so parent components can decide how to handle it.
    // This allows PrimitiveComponent.add to differentiate between whitespace
    // (which should be ignored) and meaningful text which should cause an
    // error. Returning an object mirrors the structure of component instances
    // created elsewhere in this reconciler.
    return { __text: text }
  },
  appendInitialChild(parentInstance: any, child: any) {
    runCoreSync(appendReactChildEffect(parentInstance, child))
  },
  appendChild(parentInstance: any, child: any) {
    runCoreSync(appendReactChildEffect(parentInstance, child))
  },
  appendChildToContainer(container: any, child: any) {
    runCoreSync(appendReactChildEffect(container, child))
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

const reconciler = ReactReconciler(hostConfig as any)

/** Public JSX compatibility facade; React still owns hook execution. */
export const createInstanceFromReactElement = (
  reactElm: React.JSX.Element,
): NormalComponent =>
  runCoreSync(createInstanceFromReactElementEffect(reactElm))

export const createInstanceFromReactElementEffect = (
  reactElm: React.JSX.Element,
): Effect.Effect<NormalComponent, CoreError> =>
  Effect.gen(function* () {
    const rootContainer = {
      children: [] as NormalComponent[],
      props: { name: "$root" },
      add(instance: any) {
        instance.parent = this
        this.children.push(instance)
      },
      computePcbGlobalTransform() {
        return identity()
      },
    }
    const containerErrors: Error[] = []
    const container = yield* coreSync(
      () =>
        reconciler.createContainer(
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
        ),
      "create_react_container",
    )
    yield* coreSync(() => {
      // React 19's runtime methods are newer than the supported peer declarations.
      // @ts-expect-error React reconciler runtime compatibility boundary
      reconciler.updateContainerSync(reactElm, container, null, () => {})
    }, "reconcile_react_element")
    yield* coreSync(() => {
      // @ts-expect-error React reconciler runtime compatibility boundary
      reconciler.flushSyncWork()
    }, "flush_react_component_tree")
    yield* coreSync(() => {
      if (containerErrors.length > 0) throw containerErrors[0]
    }, "check_react_container_errors")
    return yield* coreSync(
      () =>
        (reconciler.getPublicRootInstance(container) as NormalComponent) ||
        rootContainer.children[0],
      "select_react_root_instance",
    )
  })
