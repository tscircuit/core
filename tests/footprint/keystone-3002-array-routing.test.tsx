import { expect, test } from "bun:test"
import { expectKeystone3002Routing } from "tests/fixtures/expect-keystone-3002-routing"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  Keystone3002Board,
  getKeystone3002Footprint,
} from "tests/fixtures/keystone-3002-board"

test("a Circuit JSON footprint routes every Keystone 3002 contact", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Keystone3002Board footprint={getKeystone3002Footprint()} />)
  await circuit.renderUntilSettled()

  expectKeystone3002Routing(circuit)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
