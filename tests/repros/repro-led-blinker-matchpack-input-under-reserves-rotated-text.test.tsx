import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/matchpack"
import type { Bounds } from "@tscircuit/math-utils"
import type { SolverStartedEvent } from "lib/events"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Returns a Matchpack chip's reserved size in its final schematic orientation.
 * Coordinates are schematic-world millimetres with +X right and +Y up.
 */
const getFinalReservedSize = (inputProblem: InputProblem, chipId: string) => {
  const chip = inputProblem.chipMap[chipId]
  if (!chip) throw new Error(`Matchpack input is missing ${chipId}`)

  const rotation = chip.availableRotations?.[0] ?? 0

  if (rotation === 90 || rotation === 270) {
    return { x: chip.size.y, y: chip.size.x }
  }

  return chip.size
}

const getBoundsSize = (bounds: Bounds) => ({
  x: bounds.maxX - bounds.minX,
  y: bounds.maxY - bounds.minY,
})

test("repro: Core under-reserves rotated capacitor text bounds in Matchpack input", async () => {
  const { circuit } = getTestFixture()
  const solverStartedEvents: SolverStartedEvent[] = []

  circuit.on("solver:started", (event) => solverStartedEvents.push(event))

  circuit.add(
    <board name="LED_BLINKER" pcbPack pcbPackGap="1mm">
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />

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
      />

      <pinheader
        name="J1"
        pinCount={2}
        footprint="pinrow2_p2.54_id1.016mm_od1.88mm"
      />

      <resistor name="R1" resistance="10k" footprint="0805" />
      <resistor name="R2" resistance="68k" footprint="0805" />
      <resistor name="R3" resistance="1k" footprint="0805" />

      <capacitor name="C1" capacitance="10uF" footprint="1206" />
      <capacitor name="C2" capacitance="10nF" footprint="0805" />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0805"
        decouplingFor=".U1 > .VCC"
        decouplingTo="net.GND"
      />

      <led name="D1" color="red" footprint="led0603" />

      <trace from=".J1 > .pin1" to="net.VCC" />
      <trace from=".J1 > .pin2" to="net.GND" />

      <trace from=".U1 > .VCC" to="net.VCC" />
      <trace from=".U1 > .RESET" to="net.VCC" />
      <trace from=".U1 > .GND" to="net.GND" />

      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to=".U1 > .DISCH" />
      <trace from=".U1 > .DISCH" to=".R2 > .pin1" />

      <trace from=".R2 > .pin2" to="net.TIMING" />
      <trace from=".U1 > .TRIG" to="net.TIMING" />
      <trace from=".U1 > .THRES" to="net.TIMING" />
      <trace from=".C1 > .pin1" to="net.TIMING" />
      <trace from=".C1 > .pin2" to="net.GND" />

      <trace from=".U1 > .CTRL" to=".C2 > .pin1" />
      <trace from=".C2 > .pin2" to="net.GND" />

      <trace from=".U1 > .OUT" to=".R3 > .pin1" />
      <trace from=".R3 > .pin2" to=".D1 > .pin1" />
      <trace from=".D1 > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const matchpackInput = solverStartedEvents.find(
    (event) => event.solverName === "LayoutPipelineSolver",
  )?.solverParams as InputProblem | undefined
  if (!matchpackInput) {
    throw new Error("Core did not start Matchpack's LayoutPipelineSolver")
  }

  const getRenderedTextBounds = (sourceComponentName: "C1" | "C3") => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((candidate) => candidate.name === sourceComponentName)
    if (!sourceComponent) {
      throw new Error(
        `Source component ${sourceComponentName} was not rendered`,
      )
    }

    const schematicComponent = circuit.db.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })
    if (!schematicComponent) {
      throw new Error(
        `Schematic component ${sourceComponentName} was not rendered`,
      )
    }

    const textBounds = getSchematicComponentWithTextBounds({
      db: circuit.db,
      schematicComponent,
    })
    if (!textBounds) {
      throw new Error(`${sourceComponentName} has no rendered text bounds`)
    }

    return textBounds
  }

  const c1ReservedSize = getFinalReservedSize(matchpackInput, "C1")
  const c3ReservedSize = getFinalReservedSize(matchpackInput, "C3")
  const c1TextBounds = getRenderedTextBounds("C1")
  const c3TextBounds = getRenderedTextBounds("C3")
  const c1TextSize = getBoundsSize(c1TextBounds)
  const c3TextSize = getBoundsSize(c3TextBounds)

  expect(matchpackInput.chipMap.C1?.availableRotations).toEqual([270])
  expect(matchpackInput.chipMap.C3?.availableRotations).toEqual([270])

  expect(c1TextSize.x).toBeGreaterThan(c1ReservedSize.x)
  expect(c1TextSize.y).toBeGreaterThan(c1ReservedSize.y)
  expect(c3TextSize.x).toBeGreaterThan(c3ReservedSize.x)
  expect(c3TextSize.y).toBeGreaterThan(c3ReservedSize.y)

  const textBoundsOverlap =
    c1TextBounds.minX < c3TextBounds.maxX &&
    c1TextBounds.maxX > c3TextBounds.minX &&
    c1TextBounds.minY < c3TextBounds.maxY &&
    c1TextBounds.maxY > c3TextBounds.minY
  expect(textBoundsOverlap).toBe(true)

  expect(circuit).toMatchSchematicSnapshotWithBoundingBoxes(import.meta.path)
})
