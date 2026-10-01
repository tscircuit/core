import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus_lanes rejects incompatible existing fanout exits without dogboning them again", async () => {
  const { circuit } = getTestFixture()
  const inputs: any[] = []
  circuit.on("autorouting:start", (event: any) =>
    inputs.push(event.simpleRouteJson),
  )
  circuit.add(
    <board width={16} height={10} doubleSidedAssembly routeRemaining={false}>
      {(["top", "bottom"] as const).map((layer, i) => {
        const name = i ? "B" : "A"
        return (
          <fanout
            key={name}
            name={`${name}_FANOUT`}
            pcbRelative
            pcbX={i ? 4 : -4}
            pcbY={0}
            pcbTracePaths={[
              {
                connection: `${name}.pin1`,
                route: [
                  { route_type: "wire", x: 0, y: 0, layer, width: 0.1 },
                  {
                    route_type: "wire",
                    x: i ? -2 : 2,
                    y: 0,
                    layer,
                    width: 0.1,
                  },
                ],
              },
            ]}
          >
            <chip name={name} layer={layer} pinLabels={{ pin1: "DATA" }}>
              <footprint>
                <smtpad
                  shape="circle"
                  radius={0.2}
                  pcbX={0}
                  pcbY={0}
                  portHints={["pin1"]}
                />
              </footprint>
            </chip>
          </fanout>
        )
      })}
      <autoroutingphase autorouter="bus_lanes" phaseIndex={0} />
      <trace
        name="DATA"
        from=".A > .pin1"
        to=".B > .pin1"
        routingPhaseIndex={0}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(
    json.some(
      (e) =>
        e.type === "pcb_autorouting_error" &&
        e.message.includes("existing fanout handoffs cannot be dogboned again"),
    ),
  ).toBe(true)
  expect(json.filter((e) => e.type === "pcb_via")).toHaveLength(0)
  const input = inputs.at(-1)
  expect(input.traces).toHaveLength(2)
  expect(
    input.connections[0].pointsToConnect.map((p: any) => p.layer).sort(),
  ).toEqual(["bottom", "top"])
  // The failed phase publishes no partial or layer-changing route.
  expect(json.filter((e) => e.type === "pcb_trace")).toHaveLength(0)
})
