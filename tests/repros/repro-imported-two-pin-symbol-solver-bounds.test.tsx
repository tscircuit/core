import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const twoPinLabels = {
  pin1: "1",
  pin2: "2",
} as const

const commonPorts = (
  <>
    <port
      name="pin1"
      pinNumber={1}
      direction="left"
      schX={-0.4}
      schY={0}
      schStemLength={0.2}
    />
    <port
      name="pin2"
      pinNumber={2}
      direction="right"
      schX={0.4}
      schY={0}
      schStemLength={0.2}
    />
  </>
)

const fuseSymbol = (
  <symbol>
    {commonPorts}
    <schematicrect
      schX={0}
      schY={0}
      width={0.4}
      height={0.16}
      strokeWidth={0.02}
      isFilled={false}
    />
    <schematictext
      text="{NAME}"
      schX={-0.44}
      schY={0.21}
      fontSize={0.18}
      anchor="left"
    />
  </symbol>
)

const varistorSymbol = (
  <symbol>
    {commonPorts}
    <schematicrect
      schX={0}
      schY={0}
      width={0.4}
      height={0.16}
      strokeWidth={0.02}
      isFilled={false}
    />
    <schematicpath
      points={[
        { x: -0.2, y: -0.12 },
        { x: -0.12, y: -0.12 },
      ]}
    />
    <schematicpath
      points={[
        { x: -0.12, y: -0.12 },
        { x: 0.12, y: 0.12 },
      ]}
    />
    <schematicpath
      points={[
        { x: 0.12, y: 0.12 },
        { x: 0.2, y: 0.12 },
      ]}
    />
    <schematictext
      text="{NAME}"
      schX={-0.44}
      schY={0.25}
      fontSize={0.18}
      anchor="left"
    />
  </symbol>
)

test("repro: imported two-pin symbols generate asymmetric solver bounds", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width="8mm" height="8mm">
      <chip
        name="F1"
        pinLabels={twoPinLabels}
        symbol={fuseSymbol}
        schX={0}
        schY={1.5}
      />
      <chip
        name="RV1"
        pinLabels={twoPinLabels}
        symbol={varistorSymbol}
        schX={0}
        schY={-1.5}
      />
      <trace from="F1.pin2" to="RV1.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group<any>,
  )
  const solverBounds = ["F1", "RV1"].map((name) => {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const schematicComponent = circuit.db.schematic_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const chip = inputProblem.chips.find(
      (chip) => chip.chipId === schematicComponent.schematic_component_id,
    )!
    const minX = chip.center.x - chip.width / 2
    const maxX = chip.center.x + chip.width / 2

    return {
      name,
      minX,
      maxX,
      pins: chip.pins.map((pin) => ({
        x: pin.x,
        isInsideBounds: pin.x > minX && pin.x < maxX,
      })),
    }
  })

  expect(solverBounds).toMatchInlineSnapshot(`
    [
      {
        "maxX": 0.19999999999999996,
        "minX": -0.54,
        "name": "F1",
        "pins": [
          {
            "isInsideBounds": true,
            "x": -0.4,
          },
          {
            "isInsideBounds": false,
            "x": 0.4,
          },
        ],
      },
      {
        "maxX": 0.19999999999999996,
        "minX": -0.5900000000000001,
        "name": "RV1",
        "pins": [
          {
            "isInsideBounds": true,
            "x": -0.4,
          },
          {
            "isInsideBounds": false,
            "x": 0.4,
          },
        ],
      },
    ]
  `)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
