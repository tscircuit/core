import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("unknown physical ball selectors report readable component and pin names", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} routingDisabled>
      <chip
        name="U1"
        pinLabels={{ A1: "DQ0" }}
        footprint={
          <footprint>
            <smtpad portHints={["A1"]} shape="circle" radius={0.2} />
          </footprint>
        }
      />
      <trace from=".U1 > .A99" to="net.DATA" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_trace_not_connected_error
      .list()
      .some((error) => error.message.includes('does not have pin "A99"')),
  ).toBe(true)
})
