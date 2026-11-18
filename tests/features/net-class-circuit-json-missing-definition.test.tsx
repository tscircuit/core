import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("loading a classed net without its class definition produces a readable error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10}>
      <subcircuit
        name="RESTORED"
        circuitJson={[
          {
            type: "source_net",
            source_net_id: "vcc",
            name: "VCC",
            member_source_group_ids: [],
            source_net_class_ids: ["missing"],
          },
        ]}
      />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Cannot restore net "VCC": its net class definition is missing',
  )
})
