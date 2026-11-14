import { expect, test } from "bun:test"
import Cc2340Reference, {
  exportedNets,
} from "tests/fixtures/cc2340r5-reference"
import { getElectricalSignature } from "tests/fixtures/cc2340r5-reference/electrical-signature"
import moduleSignature from "tests/fixtures/cc2340r5-reference/module-electrical-signature"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("collapsed CC2340R5 reference preserves the same 13-terminal electrical interface", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(<Cc2340Reference collapsed />)
  await circuit.renderUntilSettled()
  expect(
    circuit.db.schematic_group.list().some((group) => group.show_boundary),
  ).toBe(false)
  const publicPorts = circuit.db.source_port
    .list()
    .filter((port) => port.source_group_id)
  expect(publicPorts.map((port) => port.name)).toEqual([...exportedNets])
  expect(getElectricalSignature(circuit.getCircuitJson())).toEqual(
    moduleSignature,
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1600,
    height: 1250,
    grid: false,
  })
}, 20_000)
