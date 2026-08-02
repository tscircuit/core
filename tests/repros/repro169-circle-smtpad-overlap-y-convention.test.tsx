import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro169: concentric circle pads sharing a portHint are treated as overlapping", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{ pin1: "SIG" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="0mm"
              pcbY="0mm"
              radius="0.5mm"
              shape="circle"
              layer="top"
            />
            <smtpad
              portHints={["pin1"]}
              pcbX="0mm"
              pcbY="0mm"
              radius="0.5mm"
              shape="circle"
              layer="bottom"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // The two pads are identical and concentric, so they cannot be
  // "non-overlapping". Reporting them as such leaves the pin unroutable.
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit.db.pcb_port.list()).toHaveLength(1)
})
