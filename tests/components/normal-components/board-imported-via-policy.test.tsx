import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import simpleCircuitJson from "./assets/simple-circuit.json"

test("imported pcb_board via policies survive inflation", async () => {
  const importedCircuitJson = simpleCircuitJson.map((element) =>
    element.type === "pcb_board"
      ? {
          ...element,
          allow_blind_and_buried_vias: true,
          is_via_in_pad_allowed: true,
        }
      : element,
  )

  const directFixture = getTestFixture()
  directFixture.circuit.add(<board circuitJson={importedCircuitJson as any} />)
  await directFixture.circuit.renderUntilSettled()
  expect(directFixture.circuit.db.pcb_board.list()[0]).toMatchObject({
    allow_blind_and_buried_vias: true,
    is_via_in_pad_allowed: true,
  })

  const inflatedFixture = getTestFixture()
  inflatedFixture.circuit.add(
    <subcircuit name="IMPORTED" circuitJson={importedCircuitJson as any} />,
  )
  await inflatedFixture.circuit.renderUntilSettled()
  expect(inflatedFixture.circuit.db.pcb_board.list()[0]).toMatchObject({
    allow_blind_and_buried_vias: true,
    is_via_in_pad_allowed: true,
  })
})
