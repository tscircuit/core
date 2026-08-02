import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a via connected only to a port omits its source net id", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{ pin1: ["GND"] }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0}
              width="2mm"
              height="2mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <via
        name="VIA_GND"
        pcbX={0}
        pcbY={0}
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        connectsTo=".U1 > .GND"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceVia = circuit.db.source_manually_placed_via.list()[0]

  expect(sourceVia.source_trace_id).toBeDefined()
  expect(sourceVia.source_net_id).toBeUndefined()
  expect(circuit.getCircuitJson()).not.toContainEqual(
    expect.objectContaining({
      type: "source_manually_placed_via",
      source_net_id: "",
    }),
  )
})
