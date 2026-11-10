import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout autoroutingphase carries its routed copper and exit endpoints into subsequent bus_lanes phases", async () => {
  const { circuit } = getTestFixture()
  const startEvents: any[] = []
  circuit.on("autorouting:start", (event: any) => startEvents.push(event))

  circuit.add(
    <board width={20} height={12} minTraceWidth={0.1}>
      <chip name="A" pcbX={-4} pcbY={0} pinLabels={{ pin1: "D0", pin2: "D1" }}>
        <footprint>
          <smtpad
            shape="circle"
            radius={0.2}
            pcbX={0}
            pcbY={0.5}
            portHints={["pin1"]}
          />
          <smtpad
            shape="circle"
            radius={0.2}
            pcbX={0}
            pcbY={-0.5}
            portHints={["pin2"]}
          />
        </footprint>
      </chip>
      <chip name="B" pcbX={4} pcbY={0} pinLabels={{ pin1: "D0", pin2: "D1" }}>
        <footprint>
          <smtpad
            shape="circle"
            radius={0.2}
            pcbX={0}
            pcbY={0.5}
            portHints={["pin1"]}
          />
          <smtpad
            shape="circle"
            radius={0.2}
            pcbX={0}
            pcbY={-0.5}
            portHints={["pin2"]}
          />
        </footprint>
      </chip>
      <autoroutingphase name="ADDR_FANOUT" phaseIndex={0} autorouter="fanout" />
      <autoroutingphase
        name="LANES_0"
        phaseIndex={1}
        autorouter="bus_lanes"
        connections={["D0"]}
      />
      <autoroutingphase
        name="LANES_1"
        phaseIndex={2}
        autorouter="bus_lanes"
        connections={["D1"]}
      />
      <trace name="D0" from=".A > .pin1" to=".B > .pin1" />
      <trace name="D1" from=".A > .pin2" to=".B > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const fanoutStart = startEvents.find((e) => e.phaseName === "ADDR_FANOUT")
  const lanes0Start = startEvents.find((e) => e.phaseName === "LANES_0")
  const lanes1Start = startEvents.find((e) => e.phaseName === "LANES_1")

  expect(fanoutStart).toBeDefined()
  expect(fanoutStart.connectionCount).toBe(2)
  expect(lanes0Start).toBeDefined()
  expect(lanes0Start.connectionCount).toBe(1)
  expect(lanes0Start.previousTraceCount).toBeGreaterThan(0)
  expect(lanes1Start).toBeDefined()
  expect(lanes1Start.connectionCount).toBe(1)
  expect(lanes1Start.previousTraceCount).toBeGreaterThan(
    lanes0Start.previousTraceCount,
  )
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
})
