import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("allows traces to connect to via layers", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <via
        name="V1"
        pcbX="0mm"
        pcbY="0mm"
        holeDiameter="0.5mm"
        outerDiameter="1mm"
        fromLayer="top"
        toLayer="bottom"
      />
      <testpoint name="TP1" holeDiameter="0.6mm" footprintVariant="through_hole" pcbX="-1mm" pcbY="0mm" />
      <testpoint name="TP2" holeDiameter="0.6mm" footprintVariant="through_hole" pcbX="1mm" pcbY="0mm" />
      <trace from="TP1.pin1" to="V1.top" />
      <trace from="V1.bottom" to="TP2.pin1" />
    </board>,
  )

  circuit.render()

  const vias = circuit.db.source_manually_placed_via.list()
  expect(vias.length).toBe(1)
  const viaPorts = circuit.db.source_port
    .list()
    .filter((p) => p.source_component_id === vias[0].source_manually_placed_via_id)
  expect(viaPorts.map((p) => p.name).sort()).toEqual(["bottom", "top"])
})
