import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("inflates simple_test_point components (SMT circle, SMT rect, through-hole, connected trace, rotated parent group)", async () => {
  const savedCircuitJson = await renderToCircuitJson(
    <board width="20mm" height="20mm" routingDisabled>
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padShape="circle"
        padDiameter={1.2}
        pcbX={-4}
        pcbY={2}
      />
      <testpoint
        name="TP2"
        footprintVariant="pad"
        padShape="rect"
        width={1.5}
        height={2.5}
        pcbX={0}
        pcbY={2}
      />
      <group name="G1" pcbX={4} pcbY={-2} pcbRotation={90}>
        <testpoint
          name="TP3"
          footprintVariant="through_hole"
          holeDiameter={0.6}
          pcbX={1}
          pcbY={0}
        />
      </group>
      <trace from=".TP1 > .pin1" to=".TP2 > .pin1" />
      <trace from=".TP2 > .pin1" to=".G1 > .TP3 > .pin1" />
    </board>,
  )

  const { circuit } = getTestFixture()
  circuit.add(<board circuitJson={savedCircuitJson} routingDisabled />)
  await circuit.renderUntilSettled()

  const importedJson = circuit.getCircuitJson()
  const errors = importedJson.filter((elm) => elm.type.includes("error"))
  expect(errors).toHaveLength(0)

  const tp1Source = circuit.db.source_component.getWhere({ name: "TP1" })
  const tp2Source = circuit.db.source_component.getWhere({ name: "TP2" })
  const tp3Source = circuit.db.source_component.getWhere({ name: "TP3" })

  expect(tp1Source).toMatchObject({
    ftype: "simple_test_point",
    footprint_variant: "pad",
    pad_shape: "circle",
    pad_diameter: 1.2,
  })
  expect(tp2Source).toMatchObject({
    ftype: "simple_test_point",
    footprint_variant: "pad",
    pad_shape: "rect",
    width: 1.5,
    height: 2.5,
  })
  expect(tp3Source).toMatchObject({
    ftype: "simple_test_point",
    footprint_variant: "through_hole",
    hole_diameter: 0.6,
  })

  const smtPads = circuit.db.pcb_smtpad.list()
  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(smtPads).toHaveLength(2)
  expect(platedHoles).toHaveLength(1)

  const circlePad = smtPads.find((p) => p.shape === "circle")
  const rectPad = smtPads.find((p) => p.shape === "rect")
  expect(circlePad).toMatchObject({
    shape: "circle",
    radius: 0.6,
    x: -4,
    y: 2,
  })
  expect(rectPad).toMatchObject({
    shape: "rect",
    width: 1.5,
    height: 2.5,
    x: 0,
    y: 2,
  })

  const platedHole = platedHoles[0]!
  expect(platedHole.shape).toBe("circle")
  if (platedHole.shape === "circle") {
    expect(platedHole.hole_diameter).toBeCloseTo(0.6, 5)
    expect(platedHole.x).toBeCloseTo(4, 5)
    expect(platedHole.y).toBeCloseTo(-1, 5)
  }

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces).toHaveLength(2)
})
