import { expect } from "bun:test"
import { Fragment } from "react"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export const checkCustomFanoutPresetHandoff = async (
  ramPosition: "right" | "top",
  snapshotPath: string,
) => {
  const { circuit } = getTestFixture()
  const fanoutDirections =
    ramPosition === "right"
      ? (["rightside_center", "leftside_center"] as const)
      : (["topside_center", "bottomside_center"] as const)
  const phases = createAutoroutingPhaseIoStack(circuit)
  const customFanoutInputs: SimpleRouteJson[] = []
  const customFanout = async (input: SimpleRouteJson) => {
    customFanoutInputs.push(structuredClone(input))
    return new FanoutAutorouter(input, {
      mode: "fanout",
      fanoutBounds: input.bounds,
      fanoutRoutingLayers: ["bottom"],
      busFanoutDirections: {
        DATA: fanoutDirections[customFanoutInputs.length - 1]!,
      },
    })
  }
  circuit.add(
    <board
      width={ramPosition === "right" ? 20 : 12}
      height={ramPosition === "right" ? 12 : 20}
      layers={4}
      minTraceWidth={0.1}
      defaultTraceWidth={0.1}
      minViaHoleDiameter={0.2}
      minViaPadDiameter={0.5}
    >
      {[-4, 4].map((position, chipIndex) => (
        <breakout
          key={position}
          name={`FANOUT${chipIndex}`}
          pcbX={ramPosition === "right" ? position : 0}
          pcbY={ramPosition === "top" ? position : 0}
          width={6}
          height={6}
          autorouter={{ preset: "fanout", algorithmFn: customFanout }}
          fanoutRoutingLayers={["top", "bottom"]}
          busFanoutDirections={{
            DATA: fanoutDirections[chipIndex]!,
          }}
        >
          <chip
            name={`U${chipIndex + 1}`}
            pcbRotation={ramPosition === "top" ? 90 : 0}
            footprint={
              <footprint>
                {Array.from({ length: 16 }, (_, padIndex) => (
                  <Fragment key={padIndex}>
                    <smtpad
                      portHints={[`pin${padIndex + 1}`]}
                      shape="circle"
                      radius={0.175}
                      pcbX={(padIndex % 4) * 0.8 - 1.2}
                      pcbY={Math.floor(padIndex / 4) * 0.8 - 1.2}
                    />
                  </Fragment>
                ))}
              </footprint>
            }
          />
        </breakout>
      ))}
      {[6, 7].map((pin) => (
        <Fragment key={pin}>
          <trace
            name={`DATA${pin}`}
            from={`.U1 > .pin${pin}`}
            to={`.U2 > .pin${pin}`}
          />
        </Fragment>
      ))}
      <bus
        name="DATA"
        connections={["DATA6", "DATA7"]}
        preferredLayers={["top", "bottom"]}
      />
      <pcbnotetext
        pcbY={ramPosition === "right" ? 4.7 : 8.7}
        text={
          ramPosition === "right"
            ? "Custom fanout algorithms: paired bottom-layer exits"
            : "RAM top: paired bottom-layer exits"
        }
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(customFanoutInputs).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(phases).toHaveLength(3)
  const firstFanoutWires = phases[0]!
    .endSimpleRouteJson!.traces!.flatMap((trace) => trace.route)
    .filter((point) => point.route_type === "wire")
  for (const target of Object.values(
    customFanoutInputs[1]!.buses![0]!.connectionExitTargets!,
  )) {
    expect(
      firstFanoutWires.some(
        (point) =>
          Math.hypot(point.x - target.x, point.y - target.y) < 1e-6 &&
          point.layer === target.layer,
      ),
    ).toBe(true)
  }
  for (const connection of phases[2]!.startSimpleRouteJson!.connections) {
    expect(connection.pointsToConnect.map((point) => point.layer)).toEqual([
      "bottom",
      "bottom",
    ])
  }
  const globalConnectionNames = new Set(
    phases[2]!.startSimpleRouteJson!.connections.map(
      (connection) => connection.name,
    ),
  )
  const globalTraces = phases[2]!.endSimpleRouteJson!.traces!.filter((trace) =>
    globalConnectionNames.has(trace.connection_name!),
  )
  expect(globalTraces).toHaveLength(2)
  expect(
    globalTraces
      .flatMap((trace) => trace.route)
      .filter((point) => point.route_type === "via"),
  ).toHaveLength(0)
  expect(
    circuit.db.pcb_breakout_point.list().map((point) => point.layer),
  ).toEqual(["bottom", "bottom", "bottom", "bottom"])
  await expect(circuit).toMatchPcbSnapshot(snapshotPath)
}
