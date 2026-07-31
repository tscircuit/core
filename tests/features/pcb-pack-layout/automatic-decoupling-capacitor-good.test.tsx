import { expect, test } from "bun:test"
import { getDecouplingCapacitorRelationships } from "lib/utils/decoupling-capacitors/get-decoupling-capacitor-relationships"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatically packs a VCC decoupling capacitor near its chip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VCC",
          4: "GND",
        }}
      />

      <capacitor name="C1" capacitance="100nF" footprint="0402" />

      <trace from=".U1 > .VCC" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
      <trace from=".U1 > .GND" to="net.GND" />

      <pcbnotetext
        pcbX={0}
        pcbY={-8}
        text="C1: automatically detected VCC decoupling capacitor"
        fontSize={0.8}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const chipSourceComponent = circuit.db.source_component.getWhere({
    name: "U1",
  })
  const capacitorSourceComponent = circuit.db.source_component.getWhere({
    name: "C1",
  })
  const chipPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: chipSourceComponent?.source_component_id,
  })
  const capacitorPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: capacitorSourceComponent?.source_component_id,
  })
  const [decouplingRelationship] = getDecouplingCapacitorRelationships(
    circuit.db,
  )

  expect(decouplingRelationship).toBeDefined()
  expect(chipPcbComponent).toBeDefined()
  expect(capacitorPcbComponent).toBeDefined()
  expect(
    decouplingRelationship!.capacitorSourceComponent.source_component_id,
  ).toBe(capacitorSourceComponent!.source_component_id)
  expect(decouplingRelationship!.chipSourceComponent.source_component_id).toBe(
    chipSourceComponent!.source_component_id,
  )
  expect(capacitorPcbComponent?.layer).toBe(chipPcbComponent?.layer)
  expect(
    Math.hypot(
      capacitorPcbComponent!.center.x - chipPcbComponent!.center.x,
      capacitorPcbComponent!.center.y - chipPcbComponent!.center.y,
    ),
  ).toBeLessThan(5)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
