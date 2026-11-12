import { expect, test } from "bun:test"
import Cc2340Reference from "tests/fixtures/cc2340r5-reference"
import { getElectricalSignature } from "tests/fixtures/cc2340r5-reference/electrical-signature"
import publishedSignature from "tests/fixtures/cc2340r5-reference/published-electrical-signature.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board-nested CC2340R5 reference retains its expanded rendering", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board>
      <Cc2340Reference />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.schematic_group.list().some((group) => group.show_boundary),
  ).toBe(false)
  expect(
    circuit.db.schematic_port.list().some((port) => port.boundary_position),
  ).toBe(false)
  expect(getElectricalSignature(circuit.getCircuitJson())).toEqual(
    publishedSignature,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1600,
    height: 1250,
    grid: false,
  })
}, 20_000)
