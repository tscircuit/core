import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { runCoreSync } from "lib/effect/core-error"
import { extendCatalogue } from "lib/fiber/catalogue"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { createElement } from "react"
import { z } from "zod"

const schema = z.object({ name: z.string().optional() })
class AddBase extends PrimitiveComponent<typeof schema> {
  readonly calls: string[] = []
  get config() { return { componentName: "RevisionOverrideContainer", zodProps: schema } }
}
class SyncAdd extends AddBase {
  override add(child: PrimitiveComponent) {
    this.calls.push("sync")
    super.add(child)
  }
}
class NativeAdd extends AddBase {
  override addEffect(child: PrimitiveComponent) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.addEffect(child))
  }
}
class BothAdd extends AddBase {
  override add(child: PrimitiveComponent) {
    this.calls.push("sync")
    super.add(child)
  }
  override addEffect(child: PrimitiveComponent) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.addEffect(child))
  }
}
class SyncNearAdd extends NativeAdd {
  override add(child: PrimitiveComponent) {
    this.calls.push("sync")
    super.add(child)
  }
}
class NativeNearAdd extends SyncAdd {
  override addEffect(child: PrimitiveComponent) {
    return Effect.andThen(Effect.sync(() => { this.calls.push("native") }), super.addEffect(child))
  }
}

test("addAll and JSX host attachment retain nearest-definition precedence and super attaches once", () => {
  const cases = [
    { name: "base", Parent: AddBase, calls: [] },
    { name: "sync", Parent: SyncAdd, calls: ["sync"] },
    { name: "native", Parent: NativeAdd, calls: ["native"] },
    { name: "same_owner", Parent: BothAdd, calls: ["native"] },
    { name: "sync_near", Parent: SyncNearAdd, calls: ["sync", "native"] },
    { name: "native_near", Parent: NativeNearAdd, calls: ["native"] },
  ]
  for (const fixture of cases) {
    const parent = new fixture.Parent({})
    const child = new AddBase({ name: "child" })
    const program = parent.addAllEffect([child])
    expect(parent.children).toHaveLength(0)
    runCoreSync(program)
    expect({ name: fixture.name, calls: parent.calls }).toEqual({ name: fixture.name, calls: fixture.calls })
    expect(parent.children).toEqual([child])
    expect(child.parent).toBe(parent)

    extendCatalogue({ RevisionOverrideParent: fixture.Parent, RevisionOverrideChild: AddBase })
    const jsxParent = createInstanceFromReactElement(createElement(
      "revisionoverrideparent", {}, createElement("revisionoverridechild", { name: "child" }),
    ))
    expect(jsxParent).toBeInstanceOf(fixture.Parent)
    expect(jsxParent.children).toHaveLength(1)
    expect(Reflect.get(jsxParent, "calls")).toEqual(fixture.calls)
  }
  const ownSync = new NativeAdd({})
  ownSync.add = (child) => {
    ownSync.calls.push("sync")
    AddBase.prototype.add.call(ownSync, child)
  }
  const ownNative = new SyncAdd({})
  ownNative.addEffect = (child) => Effect.andThen(
    Effect.sync(() => { ownNative.calls.push("native") }),
    AddBase.prototype.addEffect.call(ownNative, child),
  )
  for (const [parent, calls] of [[ownSync, ["sync", "native"]], [ownNative, ["native"]]] as const) {
    const child = new AddBase({})
    runCoreSync(parent.addAllEffect([child]))
    expect(parent.calls).toEqual(calls)
    expect(parent.children).toEqual([child])
  }
  const original = Object.freeze({ failure: "public sync add" })
  const throwing = new AddBase({})
  let calls = 0
  throwing.add = () => { calls++; throw original }
  let thrown: unknown
  try { runCoreSync(throwing.addAllEffect([new AddBase({})])) } catch (error) { thrown = error }
  expect(thrown).toBe(original)
  expect(calls).toBe(1)
  expect(throwing.children).toHaveLength(0)
})
