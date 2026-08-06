import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/matchpack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two-pin parts remain rotatable during schematic auto-layout", async () => {
  const { circuit } = getTestFixture()
  let capturedInput: InputProblem | undefined

  circuit.enableDebug("Group_doInitialSchematicLayoutMatchpack")
  circuit.on("debug:logOutput", (event) => {
    if (!event.name?.startsWith("matchpack-input-problem-")) return
    if (typeof event.content === "string") {
      capturedInput = JSON.parse(event.content)
      return
    }
    capturedInput = event.content as InputProblem
  })
  circuit.add(
    <board routingDisabled schAutoLayoutEnabled>
      <chip
        name="IC1"
        footprint="soic8"
        pinLabels={{ pin6: "STDBY", pin7: "CHRG" }}
      />
      <resistor name="R3" resistance="1.3k" footprint="0603" />
      <led name="CHG_RED" color="red" footprint="0603" />
      <resistor name="R4" resistance="1.3k" footprint="0603" />
      <led name="CHG_GREEN" color="green" footprint="0603" />
      <resistor name="R1" resistance="1k" footprint="0603" />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        schOrientation="vertical"
      />
      <capacitor name="C1" capacitance="1uF" footprint="0603" />
      <diode name="D1" footprint="0603" />

      <trace from="net.VBUS" to=".CHG_RED > .anode" />
      <trace from=".CHG_RED > .cathode" to=".R3 > .pin1" />
      <trace from=".R3 > .pin2" to=".IC1 > .CHRG" />
      <trace from="net.VBUS" to=".CHG_GREEN > .anode" />
      <trace from=".CHG_GREEN > .cathode" to=".R4 > .pin1" />
      <trace from=".R4 > .pin2" to=".IC1 > .STDBY" />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".R2 > .pin2" to="net.GND" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".D1 > .cathode" to="net.GND" />
    </board>,
  )
  await circuit.renderUntilSettled()
  circuit.enableDebug(false)

  expect(capturedInput?.chipMap.CHG_RED?.availableRotations).toEqual([
    0, 90, 180, 270,
  ])
  expect(capturedInput?.chipMap.CHG_GREEN?.availableRotations).toEqual([
    0, 90, 180, 270,
  ])
  expect(capturedInput?.chipMap.R1?.availableRotations).toEqual([
    0, 90, 180, 270,
  ])
  expect(capturedInput?.chipMap.R2?.availableRotations).toEqual([0])
  expect(capturedInput?.chipMap.C1?.availableRotations).toEqual([
    0, 90, 180, 270,
  ])
  expect(capturedInput?.chipMap.D1?.availableRotations).toEqual([
    0, 90, 180, 270,
  ])
})
