import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro44 - pcbPack and schematic", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" pcbPack routingDisabled>
      {/* 555 as a generic chip */}
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

      {/* Passives / LED */}
      <resistor name="R1" resistance="1k" footprint="0805" />
      <resistor name="R2" resistance="10k" footprint="0805" />
      <capacitor name="C1" capacitance="10uF" footprint="1206" />
      <capacitor name="C2" capacitance="0.01uF" footprint="0805" />
      <led name="D1" color="red" footprint="led0603" />
      <resistor name="R3" resistance="330" footprint="0805" />

      {/* (Optional) Nets + quick power labels to wire later */}
      <net name="VCC" />
      <net name="GND" />
      <trace from="U1.VCC" to="net.VCC" />
      <trace from="U1.GND" to="net.GND" />
      <trace from="U1.RESET" to="net.VCC" />
      <trace from="U1.CTRL" to="C2.pin1" />
      <trace from="C2.pin2" to="net.GND" />
      <trace from="U1.THRES" to="U1.TRIG" />
      <trace from="net.VCC" to="R1.pin1" />
      <trace from="R1.pin2" to="U1.DISCH" />
      <trace from="U1.DISCH" to="R2.pin1" />
      <trace from="R2.pin2" to="U1.THRES" />
      <trace from="U1.THRES" to="C1.pin1" />
      <trace from="C1.pin2" to="net.GND" />
      <trace from="U1.OUT" to="R3.pin1" />
      <trace from="R3.pin2" to="D1.pin1" />
      <trace from="D1.pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)

  const componentNamesBySourceId = Object.fromEntries(
    circuit.db.source_component
      .list()
      .map((component) => [component.source_component_id, component.name]),
  )

  const packedPcbComponents = circuit.db.pcb_component
    .list()
    .map((component) => ({
      name: componentNamesBySourceId[component.source_component_id],
      center: {
        x: Number(component.center.x.toFixed(3)),
        y: Number(component.center.y.toFixed(3)),
      },
      width: Number(component.width.toFixed(3)),
      height: Number(component.height.toFixed(3)),
      layer: component.layer,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  expect(packedPcbComponents).toMatchInlineSnapshot(`
    [
      {
        "center": {
          "x": 0.625,
          "y": -4.08,
        },
        "height": 1.75,
        "layer": "top",
        "name": "C1",
        "width": 4.05,
      },
      {
        "center": {
          "x": 5.075,
          "y": -4.865,
        },
        "height": 1.4,
        "layer": "top",
        "name": "C2",
        "width": 2.85,
      },
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 0,
        "layer": "top",
        "name": "D1",
        "width": 0,
      },
      {
        "center": {
          "x": 5.075,
          "y": 0.635,
        },
        "height": 1.4,
        "layer": "top",
        "name": "R1",
        "width": 2.85,
      },
      {
        "center": {
          "x": 5.075,
          "y": -1.765,
        },
        "height": 1.4,
        "layer": "top",
        "name": "R2",
        "width": 2.85,
      },
      {
        "center": {
          "x": -5.075,
          "y": -0.635,
        },
        "height": 1.4,
        "layer": "top",
        "name": "R3",
        "width": 2.85,
      },
      {
        "center": {
          "x": 0,
          "y": 0,
        },
        "height": 4.41,
        "layer": "top",
        "name": "U1",
        "width": 5.3,
      },
    ]
  `)

  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
})
