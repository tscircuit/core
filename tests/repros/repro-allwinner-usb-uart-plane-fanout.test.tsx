import { expect, test } from "bun:test"
import frozenInput from "tests/fixtures/allwinner-t113-plane-fanout/usb-uart.srj.json"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const componentNames = {
  pcb_component_113: "C_DBG_ESD",
  pcb_component_119: "U_USB_UART",
  pcb_component_120: "C_CP_100N",
  pcb_component_121: "C_CP_4U7",
  pcb_component_122: "R_CP_RESET",
  pcb_component_123: "R_DBG_SENSE_H",
  pcb_component_124: "R_DBG_SENSE_L",
  pcb_component_125: "R_USB_TO_RX",
  pcb_component_126: "R_TX_TO_USB",
}

// Original pad points are in right-handed board space (mm, +X right, +Y
// up, +Z above). Subtract the board / footprint center at each JSX boundary
// to preserve those world points in board-local / footprint-local space.
const boardCenter = { x: -45, y: 32.5 }
const footprints = Object.entries(componentNames).map(([componentId, name]) => {
  const pads = frozenInput.obstacles.filter(
    (obstacle) => obstacle.componentId === componentId,
  )
  const center = {
    x:
      (Math.min(...pads.map((pad) => pad.center.x)) +
        Math.max(...pads.map((pad) => pad.center.x))) /
      2,
    y:
      (Math.min(...pads.map((pad) => pad.center.y)) +
        Math.max(...pads.map((pad) => pad.center.y))) /
      2,
  }
  return { name, pads, center }
})

test("Allwinner USB UART power pins survive public fanout phase conversion and complete at planes", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <board
      width={17}
      height={18}
      pcbX={boardCenter.x}
      pcbY={boardCenter.y}
      layers={4}
      schematicDisabled
      minTraceWidth={0.15}
      defaultTraceWidth={0.15}
      minTraceToPadEdgeClearance={0.1}
      minViaEdgeToPadEdgeClearance={0.1}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      allowBlindAndBuriedVias={false}
    >
      <autoroutingphase
        autorouter="fanout"
        fanoutPourNetMap={{ inner1: "GND", inner2: "V3V3" }}
      />
      {footprints.map(({ name, pads, center }) => (
        <chip
          name={name}
          pcbX={center.x - boardCenter.x}
          pcbY={center.y - boardCenter.y}
          pinLabels={Object.fromEntries(
            pads.map((pad, padIndex) => [
              `pin${padIndex + 1}`,
              pad.circuitJsonMetadata.source_port_name,
            ]),
          )}
          footprint={
            <footprint>
              {pads.map((pad, padIndex) => (
                <smtpad
                  portHints={[`pin${padIndex + 1}`]}
                  shape="rect"
                  pcbX={pad.center.x - center.x}
                  pcbY={pad.center.y - center.y}
                  width={pad.width}
                  height={pad.height}
                />
              ))}
            </footprint>
          }
        />
      ))}
      {frozenInput.connections.map((connection) => {
        const sourcePoint = connection.pointsToConnect[0]!
        const footprint = footprints.find(({ pads }) =>
          pads.some(
            (pad) =>
              pad.circuitJsonMetadata.pcb_port_id === sourcePoint.pcb_port_id,
          ),
        )!
        const padIndex = footprint.pads.findIndex(
          (pad) =>
            pad.circuitJsonMetadata.pcb_port_id === sourcePoint.pcb_port_id,
        )
        const bus = frozenInput.buses.find((bus) =>
          bus.connectionNames.includes(connection.name),
        )!
        return (
          <trace
            name={connection.name}
            from={`.${footprint.name} > .pin${padIndex + 1}`}
            to={`net.${bus.termination.layer === "inner1" ? "GND" : "V3V3"}`}
          />
        )
      })}
      <pcbnotetext
        pcbX={0}
        pcbY={7.5}
        fontSize={0.5}
        text="Allwinner T113-S3 USB UART: GND / V3V3 plane fanout"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  const fanoutInput = phases[0]!.startSimpleRouteJson!
  expect(fanoutInput.connections).toHaveLength(11)
  expect(
    fanoutInput.connections.every(
      (connection) => connection.pointsToConnect.length === 1,
    ),
  ).toBe(true)
  expect(fanoutInput.buses!.map((bus) => bus.termination)).toEqual(
    frozenInput.buses.map((bus) => ({
      type: "plane" as const,
      layer: bus.termination.layer,
    })),
  )
  expect(phases[0]!.endSimpleRouteJson!.connections).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(11)
  expect(new Set(circuit.db.pcb_via.list().map((via) => via.to_layer))).toEqual(
    new Set(["inner1", "inner2"]),
  )
  expect(
    circuit.db.pcb_via
      .list()
      .every((via) => via.layers.join(",") === "top,inner1,inner2,bottom"),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
