import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { orderedRenderPhases } from "lib/components/base-components/Renderable"

// renderPhaseStates is read by lib code, by tests, and is serialized through
// getRenderGraph(). Its backing store is now two Uint8Arrays rather than one
// object per phase, so these pin the observable shape.

test("renderPhaseStates keeps its enumerable per-phase shape", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const component = circuit.selectOne("resistor")!
  const states = component.renderPhaseStates

  expect(Object.keys(states)).toEqual([...orderedRenderPhases])
  expect("SourceRender" in states).toBe(true)
  expect(Object.keys({ ...states }).length).toBe(orderedRenderPhases.length)
  expect(states.SourceRender.initialized).toBe(true)
})

test("renderPhaseStates writes are visible through a fresh read", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const component = circuit.selectOne("resistor")!
  component.renderPhaseStates.SchematicLayout.dirty = true
  expect(component.renderPhaseStates.SchematicLayout.dirty).toBe(true)

  component.renderPhaseStates.SchematicLayout.dirty = false
  expect(component.renderPhaseStates.SchematicLayout.dirty).toBe(false)
})

test("getRenderGraph serializes phase states as plain objects", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const component = circuit.selectOne("resistor")! as any
  const graph = component.getRenderGraph()
  const roundTripped = JSON.parse(JSON.stringify(graph.renderPhaseStates))

  expect(Object.keys(roundTripped)).toEqual([...orderedRenderPhases])
  expect(roundTripped.SourceRender).toEqual({
    initialized: true,
    dirty: false,
  })
})

test("_markDirty marks the phase and every phase after it", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const component = circuit.selectOne("resistor")! as any
  component._markDirty("SchematicComponentRender")

  const markedIndex = orderedRenderPhases.indexOf("SchematicComponentRender")
  for (let i = 0; i < orderedRenderPhases.length; i++) {
    expect(component.renderPhaseStates[orderedRenderPhases[i]].dirty).toBe(
      i >= markedIndex,
    )
  }
})
