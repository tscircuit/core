import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("allows traces to connect to via layers", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <via
        name="Via1"
        pcbX="-2"
        pcbY="2"
        holeDiameter="0.5mm"
        outerDiameter="1mm"
        fromLayer="top"
        toLayer="bottom"
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="1206"
        pcbX="2"
        pcbY="2"
      />
      <via
        name="Via2"
        pcbX="-2"
        pcbY="-2"
        holeDiameter="0.5mm"
        outerDiameter="1mm"
        fromLayer="top"
        toLayer="bottom"
      />
      <testpoint
        name="TP1"
        holeDiameter="0.6mm"
        footprintVariant="through_hole"
        pcbX="2"
        pcbY="-2"
      />
      <testpoint
        name="TP2"
        holeDiameter="0.6mm"
        footprintVariant="through_hole"
        pcbX="2"
        pcbY="-4"
      />

      <trace from="TP1.pin1" to="Via2.top" />
      <trace from="TP2.pin1" to="Via2.bottom" />

      <trace from="Via1.bottom" to="C1.pin1" />
    </board>,
  )

  circuit.render()

  const vias = circuit.db.source_manually_placed_via.list()
  expect(vias.length).toBe(2)
  const viaPorts = circuit.db.source_port
    .list()
    .filter(
      (p) => p.source_component_id === vias[0].source_manually_placed_via_id,
    )
  expect(viaPorts.map((p) => p.name).sort()).toEqual(["bottom", "top"])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
