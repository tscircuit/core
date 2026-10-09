import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import externalJstFootprint from "tests/fixtures/assets/external-jst-ph-b2b-footprint.json"
import { getCourtyardTestFootprintCircuitJson } from "tests/fixtures/courtyard-test-footprint"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standard connectors prefer explicit courtyards over fetched part courtyards", async () => {
  const footprintCircuitJson = [
    ...(externalJstFootprint as AnyCircuitElement[]),
    ...getCourtyardTestFootprintCircuitJson().filter((elm) =>
      elm.type.startsWith("pcb_courtyard_"),
    ),
  ]
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={22}
      height={16}
      routingDisabled
      partsEngine={{
        findPart: async () => ({ jlcpcb: ["C-JST"] }),
        fetchPartCircuitJson: async () => footprintCircuitJson,
      }}
    >
      <connector name="J1" standard="jst_ph" pinCount={2} pcbX={-5} />
      <connector name="J2" standard="jst_ph" pinCount={2} pcbX={5}>
        <courtyardrect width={5} height={6} />
      </connector>
      <pcbnotetext
        pcbY={6}
        text="J1: fetched defaults   J2: explicit courtyard"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(4)
  expect(circuit.db.pcb_courtyard_rect.list()).toHaveLength(2)
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(1)
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(1)
  const overriddenPartId = circuit.selectOne(".J2")!.pcb_component_id
  expect(
    circuit.db.pcb_courtyard_rect
      .list()
      .filter((rect) => rect.pcb_component_id === overriddenPartId),
  ).toMatchObject([{ width: 5, height: 6 }])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
