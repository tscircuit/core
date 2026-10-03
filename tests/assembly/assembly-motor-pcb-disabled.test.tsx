import { expect, test } from "bun:test"
import { assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic-only devices keep motor source records without CAD or PCB mounts", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <assembly.device>
      <assembly.motor
        name="MOTOR"
        standard="nema17"
        shaftFacingDirection="x+"
      />
      <board
        name="B1"
        width={42}
        height={42}
        mountedTo="MOTOR.backface"
        routingDisabled
      >
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
    </assembly.device>,
  )
  circuit.render()
  expect(
    circuit.db.source_component
      .list()
      .some((source) => source.name === "MOTOR"),
  ).toBe(true)
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  expect(circuit.db.pcb_board.list()).toHaveLength(0)
  const resistor = circuit.db.source_component
    .list()
    .find((source) => source.name === "R1")!
  expect(
    circuit.db.schematic_component
      .list()
      .map((symbol) => symbol.source_component_id),
  ).toEqual([resistor.source_component_id])
  await expectAssemblySnapshot(import.meta.path, {
    title: "PCB disabled: only the electrical schematic remains",
    panels: [
      {
        title: "R1 renders; the NEMA17 has no schematic symbol",
        code: `circuit.pcbDisabled = true

<assembly.device>
  <assembly.motor
    name="MOTOR" standard="nema17"
    shaftFacingDirection="x+"
  />
  <board name="B1"
    mountedTo="MOTOR.backface"
    width={42} height={42}
    routingDisabled
  >
    <resistor name="R1"
      resistance="1k"
      footprint="0402" />
  </board>
</assembly.device>`,
        annotation:
          "Schematic: R1 only / motor source record retained / PCB boards: 0 / CAD models: 0",
        circuit,
        view: "schematic",
      },
    ],
  })
})
