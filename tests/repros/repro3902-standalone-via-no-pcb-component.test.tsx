import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone vias do not emit pcb_component records (#3902)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <via
        name="V1"
        fromLayer="top"
        toLayer="bottom"
        outerDiameter="0.6mm"
        holeDiameter="0.3mm"
        pcbX={0}
        pcbY={0}
        connectsTo="net.GND"
      />
      <trace from=".R1 > .pin1" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbVias = circuit.db.pcb_via.list()
  expect(pcbVias).toHaveLength(1)

  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents).toHaveLength(1)

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })
  expect(r1Source).toBeDefined()
  expect(pcbComponents[0]?.source_component_id).toBe(
    r1Source!.source_component_id,
  )

  const viaSource = circuit.db.source_manually_placed_via.list()[0]
  expect(viaSource).toBeDefined()
  expect(
    pcbComponents.some(
      (comp) =>
        comp.source_component_id === viaSource?.source_manually_placed_via_id,
    ),
  ).toBe(false)

  const viaPcbPorts = circuit.db.pcb_port
    .list()
    .filter((port) => !port.pcb_component_id)
  expect(viaPcbPorts).toHaveLength(2)
})
