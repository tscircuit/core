import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture.ts"
import RP2040 from "./index"

test("rp2040 matches snapshots", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<RP2040 />)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
