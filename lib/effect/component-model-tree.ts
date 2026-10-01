import * as Effect from "effect/Effect"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { coreSync } from "./core-error"

function findMethodOwner(target: object, method: "add" | "addEffect") {
  let prototype: object | null = target
  while (prototype) {
    if (Object.prototype.hasOwnProperty.call(prototype, method))
      return prototype
    prototype = Object.getPrototypeOf(prototype)
  }
}

/** A sync-only extension override keeps precedence over an inherited hook. */
export function dispatchComponentAdditionEffect<Child, Error>(request: {
  parent: {
    add(child: Child): unknown
    addEffect?(child: Child): Effect.Effect<void, Error>
  }
  child: Child
}) {
  return Effect.gen(function* () {
    const useNativeHook = yield* coreSync(() => {
      if (!request.parent.addEffect) return false
      const syncOwner = findMethodOwner(request.parent, "add")
      const effectOwner = findMethodOwner(request.parent, "addEffect")
      return (
        syncOwner === effectOwner ||
        !syncOwner ||
        !effectOwner ||
        !Object.prototype.isPrototypeOf.call(effectOwner, syncOwner)
      )
    }, "resolve_component_attachment_hook")
    if (useNativeHook && request.parent.addEffect) {
      yield* request.parent.addEffect(request.child)
    } else {
      yield* coreSync(() => {
        request.parent.add(request.child)
      }, "append_external_component_child")
    }
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
