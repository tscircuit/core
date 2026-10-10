import { expect, test } from "bun:test"
import {
  type RenderPhase,
  type RenderPhaseStates,
} from "lib/components/base-components/Renderable"
import { Port } from "lib/components/primitive-components/Port/Port"
import { SmtPad } from "lib/components/primitive-components/SmtPad"

class MatchingPortProbe extends Port {
  phaseMapReads = 0
  dirtyPhases: RenderPhase[] = []

  override get renderPhaseStates(): RenderPhaseStates {
    this.phaseMapReads++
    return super.renderPhaseStates
  }

  // Isolate matching from PCB database insertion while using the real phase loop.
  override doInitialPcbPortRender() {}

  override _markDirty(phase: RenderPhase) {
    this.dirtyPhases.push(phase)
    super._markDirty(phase)
  }
}

test("PCB port matches stay lazy and dirty later phases only after initial rendering", () => {
  const port = new MatchingPortProbe({ name: "pin1" })
  const pad = new SmtPad({ shape: "rect", width: 1, height: 1 })

  port.registerMatch(pad)
  expect(port.dirtyPhases).toEqual([])
  expect(port.phaseMapReads).toBe(0)

  port.runRenderPhase("PcbPortRender")
  const otherPort = new Port({ name: "pin2" })
  port.registerMatch(otherPort)
  expect(port.dirtyPhases).toEqual([])

  port.registerMatch(pad)
  expect(port.matchedComponents).toEqual([pad, otherPort, pad])
  expect(port.dirtyPhases).toEqual(["PcbPortRender"])
  expect(port.phaseMapReads).toBe(0)
  expect(port.renderPhaseStates.PcbPortRender.dirty).toBe(true)
  expect(port.renderPhaseStates.PcbTraceRender.dirty).toBe(true)
})
