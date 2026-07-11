import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A net label pointing at a net name that can't be resolved to a source net
// (e.g. a name containing a space) should degrade gracefully instead of
// throwing "Cannot read properties of null (reading 'source_net_id')" and
// aborting the entire schematic render cycle.
it("should not crash when a net label references an unresolvable net", async () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <netlabel net="my net" schX="1mm" schY="1mm" />
    </board>,
  )

  expect(() => project.render()).not.toThrow()

  // No schematic net label is emitted for the unresolvable net, but the rest
  // of the render completes without error.
  expect(project.db.schematic_net_label.list()).toHaveLength(0)
})
