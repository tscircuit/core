import { expect, test } from "bun:test"
import { DogboneAutorouter } from "@tscircuit/dogbone-solver"
import type { AutorouterConfig } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dogbone handoff aliases route as one owned bus lane", async () => {
  const { circuit } = getTestFixture()
  let customDogboneCalls = 0
  const dogbone: AutorouterConfig = {
    preset: "dogbone",
    algorithmFn: async (input) => {
      customDogboneCalls++
      return new DogboneAutorouter({
        input,
        fanoutRoutingLayers: ["bottom"],
      })
    },
  }
  circuit.add(
    <board
      width={16}
      height={10}
      schematicDisabled
      minTraceWidth={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
      minTraceToPadEdgeClearance={0.1}
      minViaEdgeToPadEdgeClearance={0.1}
      isViaInPadAllowed={false}
      routeRemaining={false}
    >
      <fanout
        name="LEFT"
        pcbX={-3}
        autorouter={dogbone}
        fanoutRoutingLayers={["bottom"]}
      >
        <chip
          name="U1"
          pinLabels={{ pin1: ["DATA"], pin2: ["B"], pin3: ["C"], pin4: ["D"] }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                shape="circle"
                radius={0.2}
                pcbX={-0.4}
                pcbY={-0.4}
              />
              <smtpad
                portHints={["pin2"]}
                shape="circle"
                radius={0.2}
                pcbX={0.4}
                pcbY={-0.4}
              />
              <smtpad
                portHints={["pin3"]}
                shape="circle"
                radius={0.2}
                pcbX={-0.4}
                pcbY={0.4}
              />
              <smtpad
                portHints={["pin4"]}
                shape="circle"
                radius={0.2}
                pcbX={0.4}
                pcbY={0.4}
              />
            </footprint>
          }
        />
      </fanout>
      <fanout
        name="RIGHT"
        pcbX={3}
        autorouter={dogbone}
        fanoutRoutingLayers={["bottom"]}
      >
        <chip
          name="U2"
          pinLabels={{ pin1: ["DATA"], pin2: ["B"], pin3: ["C"], pin4: ["D"] }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                shape="circle"
                radius={0.2}
                pcbX={-0.4}
                pcbY={-0.4}
              />
              <smtpad
                portHints={["pin2"]}
                shape="circle"
                radius={0.2}
                pcbX={0.4}
                pcbY={-0.4}
              />
              <smtpad
                portHints={["pin3"]}
                shape="circle"
                radius={0.2}
                pcbX={-0.4}
                pcbY={0.4}
              />
              <smtpad
                portHints={["pin4"]}
                shape="circle"
                radius={0.2}
                pcbX={0.4}
                pcbY={0.4}
              />
            </footprint>
          }
        />
      </fanout>
      <autoroutingphase
        name="DATA"
        autorouter="bus_lanes"
        phaseIndex={0}
        connections={["U1.pin1", "U2.pin1"]}
      />
      <net
        name="DATA_NET"
        connectsTo={["U1.pin1", "U2.pin1"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={0}
      />
      <trace
        name="FORWARD"
        from="U1.pin1"
        to="U2.pin1"
        thickness={0.1}
        routingPhaseIndex={0}
      />
      <trace
        name="REVERSE"
        from="U2.pin1"
        to="U1.pin1"
        thickness={0.1}
        routingPhaseIndex={0}
      />
      <bus
        name="DATA_BUS"
        connections={["FORWARD"]}
        pcbAllowedLayers={["bottom"]}
        routingPhaseIndex={0}
      />
      <pcbnotetext
        pcbY={3}
        text="Two local escapes, one shared data lane"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(customDogboneCalls).toBe(2)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(
    circuit.db.pcb_trace
      .list()
      .filter((trace) =>
        trace.route.every(
          (point) => point.route_type === "wire" && point.layer === "bottom",
        ),
      ),
  ).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
  })
})
