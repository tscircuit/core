import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { IsolatedCircuit } from "lib/IsolatedCircuit"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Renderable, type RenderPhase } from "lib/components/base-components/Renderable"
import { Resistor } from "lib/components/normal-components/Resistor"
import { extendCatalogue } from "lib/fiber/catalogue"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { createElement, type ReactElement } from "react"
import { z } from "zod"
import "lib/register-catalogue"

// This file deliberately imports no rewrite-only API. Run the identical file
// with the baseline cwd/tsconfig to characterize the old public extensions.
class BaseRenderable extends Renderable {
  readonly calls: string[] = []
  constructor() { super({}) }
}
class LegacyRenderable extends BaseRenderable {
  override runRenderPhase(phase: RenderPhase) { this.calls.push("phase"); super.runRenderPhase(phase) }
  override runRenderPhaseForChildren(phase: RenderPhase) { this.calls.push("children"); super.runRenderPhaseForChildren(phase) }
  override _markDirty(phase: RenderPhase) { this.calls.push("dirty"); super._markDirty(phase) }
  override _hasIncompleteAsyncEffects() { this.calls.push("incomplete"); return super._hasIncompleteAsyncEffects() }
  override _hasIncompleteAsyncEffectsInSubtreeForPhase(phase: RenderPhase) { this.calls.push("incomplete_phase"); return super._hasIncompleteAsyncEffectsInSubtreeForPhase(phase) }
}
const schema = z.object({ name: z.string().optional() })
class BaseContainer extends PrimitiveComponent<typeof schema> {
  readonly calls: string[] = []
  get config() { return { componentName: "RevisionBaselineContainer", zodProps: schema } }
}
class LegacyContainer extends BaseContainer {
  override add(child: PrimitiveComponent) { this.calls.push("add"); super.add(child) }
}
class LegacyCycle extends BaseContainer {
  override get isGroup() { return true }
  override runRenderPhase(_phase: RenderPhase) {}
  override runRenderPhaseForChildren(_phase: RenderPhase) {}
  override runRenderCycle() { this.calls.push("cycle"); super.runRenderCycle() }
}
class LegacyCircuit extends IsolatedCircuit {
  readonly calls: string[] = []
  override render() { this.calls.push("render"); super.render() }
}
class LegacyResistor extends Resistor {
  readonly calls: string[] = []
  querySupplier(partsEngine: PartsEngine, sourceComponent: Parameters<PartsEngine["findPart"]>[0]["sourceComponent"]) {
    return this._getSupplierPartNumbers(partsEngine, sourceComponent, undefined)
  }
  protected override _getSupplierPartNumbers(partsEngine: PartsEngine, sourceComponent: Parameters<PartsEngine["findPart"]>[0]["sourceComponent"], footprinterString: string | undefined) {
    this.calls.push("supplier")
    return super._getSupplierPartNumbers(partsEngine, sourceComponent, footprinterString)
  }
  override _renderReactSubtree(element: ReactElement) { this.calls.push("react"); return super._renderReactSubtree(element) }
}
function attach(parent: Renderable, child: Renderable) { parent.children.push(child); child.parent = parent }

test("baseline public sync extensions and super calls remain observable without rewrite-only APIs", async () => {
  for (const family of ["phase", "children", "dirty", "incomplete", "incomplete_phase"] as const) {
    for (const instanceOwn of [false, true]) {
      const actor = new LegacyRenderable()
      const wrapper = new BaseRenderable()
      if (instanceOwn) {
        // An instance-own wrapper calls the inherited override exactly once.
        const method = family === "phase" ? "runRenderPhase" : family === "children" ? "runRenderPhaseForChildren" : family === "dirty" ? "_markDirty" : family === "incomplete" ? "_hasIncompleteAsyncEffects" : "_hasIncompleteAsyncEffectsInSubtreeForPhase"
        const inherited = Reflect.get(actor, method)
        Object.defineProperty(actor, method, { value: (phase: RenderPhase) => {
          actor.calls.push("own")
          return Reflect.apply(inherited, actor, [phase])
        } })
      }
      if (family === "dirty") { attach(actor, wrapper); wrapper._markDirty("SourceRender") }
      else {
        attach(wrapper, actor)
        if (family === "incomplete") expect(wrapper._hasIncompleteAsyncEffects()).toBe(false)
        else if (family === "incomplete_phase") expect(wrapper._hasIncompleteAsyncEffectsInSubtreeForPhase("SourceRender")).toBe(false)
        else wrapper.runRenderPhaseForChildren("SourceRender")
      }
      expect(actor.calls.filter((call) => call === family || call === "own")).toEqual(instanceOwn ? ["own", family] : [family])
    }
  }
  const parent = new LegacyContainer({})
  const child = new BaseContainer({ name: "child" })
  parent.addAll([child])
  expect(parent.calls).toEqual(["add"])
  expect(parent.children).toEqual([child])
  extendCatalogue({ RevisionBaselineParent: LegacyContainer, RevisionBaselineChild: BaseContainer })
  const jsxParent = createInstanceFromReactElement(createElement("revisionbaselineparent", {}, createElement("revisionbaselinechild", {})))
  expect(Reflect.get(jsxParent, "calls")).toEqual(["add"])
  expect(jsxParent.children).toHaveLength(1)

  for (const operation of ["render", "json", "settle"] as const) {
    const circuit = new LegacyCircuit()
    const actor = new LegacyCycle({})
    circuit.add(actor)
    if (operation === "render") circuit.render()
    else if (operation === "json") circuit.getCircuitJson()
    else await circuit.renderUntilSettled()
    expect(circuit.calls).toEqual(["render"])
    expect(actor.calls).toEqual(["cycle"])
    const dispose = Reflect.get(circuit, "dispose")
    if (typeof dispose === "function") await Reflect.apply(dispose, circuit, [])
  }
  const resistor = new LegacyResistor({ name: "R1", resistance: "1k" })
  let providerCalls = 0
  expect(await resistor.querySupplier({ findPart: () => { providerCalls++; return { jlcpcb: ["baseline"] } } }, {
    type: "source_component", source_component_id: "revision_source", name: "R1", ftype: "simple_resistor", resistance: 1000,
  })).toEqual({ jlcpcb: ["baseline"] })
  resistor.add(<silkscreentext text="baseline extension" />)
  expect(resistor.calls).toEqual(["supplier", "react"])
  expect(providerCalls).toBe(1)

  const original = Object.freeze({ failure: "baseline sync override" })
  const circuit = new LegacyCircuit()
  let calls = 0
  circuit.render = () => { calls++; throw original }
  let thrown: unknown
  try { circuit.getCircuitJson() } catch (error) { thrown = error }
  expect(thrown).toBe(original)
  expect(calls).toBe(1)
  const dispose = Reflect.get(circuit, "dispose")
  if (typeof dispose === "function") await Reflect.apply(dispose, circuit, [])
})
