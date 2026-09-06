import { expect, test } from "bun:test"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export default function Lm386AudioAmplifier() {
  return (
    <board name="LM386_AUDIO_AMP" pcbPack pcbPackGap="0.5mm">
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />

      <schematictext
        text="REPRO181: auto-layout overlaps C_GAIN with R_ZOBEL and C_BYPASS with C_OUT"
        schX={0}
        schY={4.5}
        fontSize={0.25}
      />

      {/* LM386 Audio Power Amplifier */}
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "GAIN1",
          pin2: "IN_NEG",
          pin3: "IN_POS",
          pin4: "GND",
          pin5: "VOUT",
          pin6: "VS",
          pin7: "BYPASS",
          pin8: "GAIN2",
        }}
      />

      {/* Input volume & AC coupling */}
      <capacitor name="C_IN" capacitance="10uF" footprint="1206" />
      <resistor name="R_VOL" resistance="10k" footprint="0805" />

      {/* Gain setting network between pin 1 and pin 8 */}
      <capacitor name="C_GAIN" capacitance="10uF" footprint="1206" />
      <resistor name="R_GAIN" resistance="1.2k" footprint="0805" />

      {/* Power decoupling and bypass */}
      <capacitor name="C_BYPASS" capacitance="10uF" footprint="1206" />
      <capacitor name="C_VS" capacitance="100uF" footprint="1206" />
      <capacitor name="C_DEC" capacitance="100nF" footprint="0805" />

      {/* Zobel snubber network (R + C in series to GND on output) */}
      <resistor name="R_ZOBEL" resistance="10" footprint="0805" />
      <capacitor name="C_ZOBEL" capacitance="47nF" footprint="0805" />

      {/* Output AC coupling capacitor and speaker load */}
      <capacitor name="C_OUT" capacitance="220uF" footprint="1210" />
      <resistor name="R_LOAD" resistance="8" footprint="1206" />

      {/* Power & ground connections */}
      <trace from=".U1 > .VS" to="net.VCC" />
      <trace from=".U1 > .GND" to="net.GND" />
      <trace from=".U1 > .IN_NEG" to="net.GND" />

      {/* Bypass cap */}
      <trace from=".U1 > .BYPASS" to=".C_BYPASS > .pin1" />
      <trace from=".C_BYPASS > .pin2" to="net.GND" />

      {/* Supply decoupling caps */}
      <trace from=".C_VS > .pin1" to="net.VCC" />
      <trace from=".C_VS > .pin2" to="net.GND" />
      <trace from=".C_DEC > .pin1" to="net.VCC" />
      <trace from=".C_DEC > .pin2" to="net.GND" />

      {/* Gain network */}
      <trace from=".U1 > .GAIN1" to=".C_GAIN > .pin1" />
      <trace from=".C_GAIN > .pin2" to=".R_GAIN > .pin1" />
      <trace from=".R_GAIN > .pin2" to=".U1 > .GAIN2" />

      {/* Input network */}
      <trace from=".C_IN > .pin2" to=".U1 > .IN_POS" />
      <trace from=".U1 > .IN_POS" to=".R_VOL > .pin1" />
      <trace from=".R_VOL > .pin2" to="net.GND" />

      {/* Output Zobel network */}
      <trace from=".U1 > .VOUT" to=".R_ZOBEL > .pin1" />
      <trace from=".R_ZOBEL > .pin2" to=".C_ZOBEL > .pin1" />
      <trace from=".C_ZOBEL > .pin2" to="net.GND" />

      {/* Output to speaker load */}
      <trace from=".U1 > .VOUT" to=".C_OUT > .pin1" />
      <trace from=".C_OUT > .pin2" to=".R_LOAD > .pin1" />
      <trace from=".R_LOAD > .pin2" to="net.GND" />
    </board>
  )
}

test("repro181: LM386 audio amplifier auto-layout produces overlapping components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<Lm386AudioAmplifier />)
  await circuit.renderUntilSettled()

  const getRenderedBounds = (componentName: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((c) => c.name === componentName)
    if (!sourceComponent) {
      throw new Error(`Source component ${componentName} not found`)
    }
    const schematicComponent = circuit.db.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })
    if (!schematicComponent) {
      throw new Error(`Schematic component ${componentName} not found`)
    }
    const bounds = getSchematicComponentWithTextBounds({
      db: circuit.db,
      schematicComponent,
    })
    if (!bounds) {
      throw new Error(`Text bounds for ${componentName} not found`)
    }
    return bounds
  }

  // Confirm that auto-layout placed C_GAIN overlapping R_ZOBEL
  const cGainBounds = getRenderedBounds("C_GAIN")
  const rZobelBounds = getRenderedBounds("R_ZOBEL")
  const cGainRZobelOverlap =
    cGainBounds.minX < rZobelBounds.maxX &&
    cGainBounds.maxX > rZobelBounds.minX &&
    cGainBounds.minY < rZobelBounds.maxY &&
    cGainBounds.maxY > rZobelBounds.minY
  expect(cGainRZobelOverlap).toBe(true)

  // Confirm that auto-layout placed C_BYPASS overlapping C_OUT
  const cBypassBounds = getRenderedBounds("C_BYPASS")
  const cOutBounds = getRenderedBounds("C_OUT")
  const cBypassCOutOverlap =
    cBypassBounds.minX < cOutBounds.maxX &&
    cBypassBounds.maxX > cOutBounds.minX &&
    cBypassBounds.minY < cOutBounds.maxY &&
    cBypassBounds.maxY > cOutBounds.minY
  expect(cBypassCOutOverlap).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
