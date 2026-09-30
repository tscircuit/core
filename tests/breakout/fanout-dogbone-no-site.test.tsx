import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dogbone failure does not publish partial handoffs", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={16}
      height={12}
      minTraceWidth={0.1}
      minViaPadDiameter={2}
      minViaHoleDiameter={0.15}
    >
      <fanout autorouter="dogbone" fanoutRoutingLayers={["bottom"]}>
        <chip
          name="U1"
          pcbX={-3}
          footprint={
            <footprint>
              <smtpad
                portHints={["1"]}
                shape="circle"
                radius={0.2}
                pcbX={0}
                pcbY={0}
              />
              <smtpad
                portHints={["2"]}
                shape="circle"
                radius={0.2}
                pcbX={0.8}
                pcbY={0}
              />
              <smtpad
                portHints={["3"]}
                shape="circle"
                radius={0.2}
                pcbX={0}
                pcbY={0.8}
              />
              <smtpad
                portHints={["4"]}
                shape="circle"
                radius={0.2}
                pcbX={0.8}
                pcbY={0.8}
              />
            </footprint>
          }
        />
      </fanout>
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        layer="bottom"
        pcbX={4}
      />
      <trace from="U1.1" to="R1.1" />
      <pcbnotetext
        pcbY={4}
        text="Local dogbone, then bottom-layer routing to R1"
        fontSize={0.4}
      />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "No complete local dogbone assignment",
  )
  expect(circuit.db.pcb_trace.list()).toEqual([])
  expect(circuit.db.pcb_via.list()).toEqual([])
  expect(circuit.db.pcb_breakout_point.list()).toEqual([])
})
