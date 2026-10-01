import * as Effect from "effect/Effect"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { coreSync, type CoreError } from "./core-error"
import { prefersNativeMethod } from "./override-dispatch"

/** A sync-only extension override keeps precedence over an inherited hook. */
export function dispatchComponentAdditionEffect<Child, Error>(request: {
  parent: {
    add(child: Child): unknown
    addEffect?(child: Child): Effect.Effect<void, Error>
  }
  child: Child
}): Effect.Effect<void, Error | CoreError> {
  return Effect.suspend((): Effect.Effect<void, Error | CoreError> => {
    const useNativeHook =
      request.parent.addEffect &&
      prefersNativeMethod(request.parent, "add", "addEffect")
    if (useNativeHook && request.parent.addEffect) {
      return request.parent.addEffect(request.child)
    }
    return coreSync(() => {
      request.parent.add(request.child)
    }, "append_external_component_child")
  })
}

/** React text nodes are an external host value, not a circuit component. */
export function validateChildAttachment(request: {
  parent: PrimitiveComponent
  child: PrimitiveComponent
}) {
  return coreSync(() => {
    const { parent, child } = request
    const textContent = Reflect.get(child, "__text")
    if (typeof textContent === "string") {
      if (parent.canHaveTextChildren || textContent.trim() === "") return false
      const parentName = parent._parsedProps?.name
      const descriptor = parentName
        ? `<${parent.componentName} name="${parentName}">`
        : `<${parent.componentName}>`
      const nanHint = /^NaN/.test(textContent.trim())
        ? ` This looks like a numeric expression that evaluated to NaN (e.g. \`\${value}${textContent.trim().replace(/^NaN/, "")}\` where \`value\` is NaN) — check the computation that produces this value.`
        : ""
      throw new Error(
        `Invalid JSX Element: ${descriptor} received stray text "${textContent}" as a child, but it cannot hold text children. Remove the text or wrap it in an appropriate component.${nanHint}`,
      )
    }
    if (Object.keys(child).length === 0) return false
    if (child.lowercaseComponentName === "panel") {
      throw new Error("<panel> must be a root-level element")
    }
    if (!child.onAddToParent) {
      throw new Error(
        `Invalid JSX Element: Expected a React component but received "${JSON.stringify(child)}"`,
      )
    }
    return true
  }, "validate_child_attachment")
}
