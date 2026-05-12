import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test(
  "repro48: 555 timer circuit",
  () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board pcbPack>
        {/* --- 555 timer as a generic 8‑pin chip --- */}
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{
            pin1: "GND",
            pin2: "TRIG",
            pin3: "OUT",
            pin4: "RESET",
            pin5: "CTRL",
            pin6: "THRES",
            pin7: "DISCH",
            pin8: "VCC",
          }}
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: ["RESET", "CTRL", "THRES", "TRIG"],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: ["VCC", "OUT", "DISCH", "GND"],
            },
          }}
        />
        {/* Timing network for astable mode */}
        <resistor name="R1" resistance="1k" footprint="0805" />{" "}
        {/* VCC -> DISCH */}
        <resistor name="R2" resistance="10k" footprint="0805" />{" "}
        {/* DISCH -> node */}
        <capacitor name="C1" capacitance="10uF" footprint="1206" />{" "}
        {/* node -> GND */}
        <capacitor name="C2" capacitance="10nF" footprint="0805" />{" "}
        {/* CTRL -> GND (stability) */}
        {/* 3-pin header for power + output */}
        <pinheader
          name="J1"
          pinCount={3}
          footprint="pinrow3"
          gender="male"
          schFacingDirection="left"
          pinLabels={{ pin1: "VCC", pin2: "OUT", pin3: "GND" }}
          connections={{ VCC: "net.VCC", OUT: "net.OUT", GND: "net.GND" }}
        />
        {/* Power & housekeeping */}
        <trace from="U1.VCC" to="net.VCC" />
        <trace from="U1.GND" to="net.GND" />
        <trace from="U1.RESET" to="net.VCC" />
        <trace from="U1.CTRL" to="C2.pin1" />
        <trace from="C2.pin2" to="net.GND" />
        {/* Astable wiring: tie THRES & TRIG; R1, R2, C1 form RC network */}
        <trace from="U1.THRES" to="net.NODE" />
        <trace from="U1.TRIG" to="net.NODE" />
        <trace from="R2.pin2" to="net.NODE" />
        <trace from="C1.pin1" to="net.NODE" />
        <trace from="C1.pin2" to="net.GND" />
        {/* R1 from VCC to DISCH; R2 from DISCH to node */}
        <trace from="R1.pin1" to="net.VCC" />
        <trace from="R1.pin2" to="U1.DISCH" />
        <trace from="U1.DISCH" to="R2.pin1" />
        {/* Output to header */}
        <trace from="U1.OUT" to="net.OUT" />
      </board>,
    )

    circuit.render()

    const u1SourceComponent = circuit.db.source_component.getWhere({
      name: "U1",
    })
    const u1GndSourcePort = circuit.db.source_port.list().find((port) => {
      if (port.source_component_id !== u1SourceComponent?.source_component_id) {
        return false
      }
      return (
        port.name === "GND" ||
        (port as any).pin_label === "GND" ||
        port.port_hints?.includes("GND") ||
        port.port_hints?.includes("pin1")
      )
    })
    const u1GndSchematicPort = circuit.db.schematic_port.list().find((port) => {
      return port.source_port_id === u1GndSourcePort?.source_port_id
    })
    expect(u1GndSchematicPort).toBeDefined()

    const gndLabelsNearU1Gnd = circuit.db.schematic_net_label
      .list()
      .filter((label) => {
        if (label.text !== "GND") return false
        const dx = label.anchor_position!.x - u1GndSchematicPort!.center.x
        const dy = label.anchor_position!.y - u1GndSchematicPort!.center.y
        return dx * dx + dy * dy < 0.5 * 0.5
      })
    expect(gndLabelsNearU1Gnd).toHaveLength(1)
    expect(gndLabelsNearU1Gnd[0]!.anchor_position).toEqual(
      u1GndSchematicPort!.center,
    )

    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  {
    timeout: 120000,
  },
)
