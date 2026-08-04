import { BQ25895RTWR } from "@tsci/tscircuit.ti"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Repro = () => (
  <subcircuit schMaxTraceDistance={20}>
    <BQ25895RTWR
      name="U1"
      schX={0}
      schY={0}
      schWidth={2.6}
      schHeight={7.5}
      showPinAliases={false}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [
            "PMID",
            "VBUS",
            "D_POS",
            "D_NEG",
            "ILIM",
            "STAT",
            "SDA",
            "SCL",
            "INT",
            "OTG",
            "CE",
          ],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["SW1", "BTST", "REGN", "PGND1", "SYS1", "BAT1", "QON", "TS"],
        },
      }}
      schPinStyle={{
        PMID: { marginBottom: 0.9 },
        VBUS: { marginBottom: 0.55 },
        D_POS: { marginBottom: 0.05 },
        D_NEG: { marginBottom: 0.35 },
        ILIM: { marginBottom: 0.7 },
        STAT: { marginBottom: 0.45 },
        SDA: { marginBottom: 0.05 },
        SCL: { marginBottom: 0.05 },
        INT: { marginBottom: 0.05 },
        OTG: { marginBottom: 0.05 },
        SW1: { marginBottom: 0.99 },
        BTST: { marginBottom: 0.05 },
        REGN: { marginBottom: 0.5 },
        PGND1: { marginBottom: 0.6 },
        SYS1: { marginBottom: 0.45 },
        BAT1: { marginBottom: 0.45 },
        QON: { marginBottom: 0.95 },
      }}
      connections={{ pin17: "net.GND" }}
    />

    <chip
      name="J1"
      manufacturerPartNumber="USB Input"
      pinLabels={{
        pin1: "VBUS",
        pin2: "D_POS",
        pin3: "D_NEG",
        pin4: "GND",
      }}
      schX={-10.8}
      schY={1.4}
      schPinArrangement={{
        rightSide: {
          direction: "top-to-bottom",
          pins: ["pin1", "pin2", "pin3", "pin4"],
        },
      }}
      connections={{ pin4: "net.GND" }}
    />
    <chip
      name="J2"
      manufacturerPartNumber="Phone OTG"
      pinLabels={{ pin1: "5V", pin2: "GND" }}
      schX={-4.5}
      schY={4.05}
      schPinArrangement={{
        rightSide: {
          direction: "top-to-bottom",
          pins: ["pin1", "pin2"],
        },
      }}
      connections={{ pin2: "net.GND" }}
    />
    <capacitor
      name="C1"
      capacitance="1uF"
      schX={-6}
      schY={1.45}
      schOrientation="vertical"
      connections={{ pin2: "net.GND" }}
    />
    <capacitor
      name="C2"
      capacitance="40uF"
      schX={-2.7}
      schY={3.3}
      schRotation={90}
      connections={{ pin2: "net.GND" }}
    />
    <chip
      name="J3"
      manufacturerPartNumber="Host"
      pinLabels={{
        pin1: "VREF",
        pin2: "SDA",
        pin3: "SCL",
        pin4: "INT",
        pin5: "OTG",
        pin6: "CE",
      }}
      schX={-10.8}
      schY={-3.25}
      schPinArrangement={{
        rightSide: {
          direction: "top-to-bottom",
          pins: ["pin1", "pin2", "pin3", "pin4", "pin5", "pin6"],
        },
      }}
      connections={{ pin1: "net.VREF" }}
    />

    <resistor
      name="R1"
      resistance="260"
      schX={-2.5}
      schY={-0.05}
      schRotation={180}
      connections={{ pin2: "net.GND" }}
    />

    <resistor
      name="R4"
      resistance="10k"
      schX={-5.8}
      schY={-2.35}
      schOrientation="vertical"
      connections={{ pin1: "net.VREF" }}
    />

    <resistor
      name="R5"
      resistance="2.2k"
      schX={-4.65}
      schY={-0.75}
      schOrientation="vertical"
    />
    <inductor
      name="L1"
      inductance="2.2uH"
      schX={4.35}
      schY={3.25}
      schOrientation="horizontal"
    />

    <trace from="R1.pin1" to="U1.ILIM" />
    <trace from="J3.pin4" to="R4.pin2" />
    <trace from="R4.pin2" to="U1.INT" />
    <trace from="J3.pin5" to="U1.OTG" />
    <trace from="J3.pin6" to="U1.CE" />

    <trace from="R5.pin1" to="L1.pin2" />
  </subcircuit>
)

test("BQ25895 CE trace keeps clearance from the GND trace", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(<Repro />)

  await circuit.renderUntilSettled()

  const traces = circuit.db.schematic_trace.list()
  const u1 = circuit.db.source_component.getWhere({ name: "U1" })!
  const r1 = circuit.db.source_component.getWhere({ name: "R1" })!
  const sourcePorts = circuit.db.source_port.list()
  const ceConnectivityKey = sourcePorts.find(
    (port) =>
      port.source_component_id === u1.source_component_id && port.name === "CE",
  )!.subcircuit_connectivity_map_key
  const gndConnectivityKey = sourcePorts.find(
    (port) =>
      port.source_component_id === r1.source_component_id &&
      port.name === "pin2",
  )!.subcircuit_connectivity_map_key
  const ceTraces = traces.filter(
    (trace) => trace.subcircuit_connectivity_map_key === ceConnectivityKey,
  )
  const gndTraces = traces.filter(
    (trace) => trace.subcircuit_connectivity_map_key === gndConnectivityKey,
  )

  const hasCrossNetParallelOverlap = ceTraces.some((ceTrace) =>
    gndTraces.some((gndTrace) =>
      ceTrace.edges.some((ceEdge) =>
        gndTrace.edges.some((gndEdge) => {
          const ceIsVertical = ceEdge.from.x === ceEdge.to.x
          const gndIsVertical = gndEdge.from.x === gndEdge.to.x
          const xSeparation = Math.abs(ceEdge.from.x - gndEdge.from.x)
          const verticalOverlap =
            Math.min(
              Math.max(ceEdge.from.y, ceEdge.to.y),
              Math.max(gndEdge.from.y, gndEdge.to.y),
            ) -
            Math.max(
              Math.min(ceEdge.from.y, ceEdge.to.y),
              Math.min(gndEdge.from.y, gndEdge.to.y),
            )

          return (
            ceIsVertical &&
            gndIsVertical &&
            xSeparation <= 0.020001 &&
            verticalOverlap > 0
          )
        }),
      ),
    ),
  )

  expect(hasCrossNetParallelOverlap).toBe(false)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
