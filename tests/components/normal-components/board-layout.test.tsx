import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with manual layout edits", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      outline={[
        { x: -8, y: -6 },
        { x: 0, y: -6 },
        { x: 10, y: 10 },
        { x: 5, y: 10 },
      ]}
      manualEdits={{
        pcb_placements: [
          {
            selector: ".R1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
          {
            selector: ".C1",
            center: { x: -5, y: -5 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="10uF" footprint="0603" />
    </board>,
  )

  circuit.render()

  const resistor = circuit.selectOne(".R1")
  const capacitor = circuit.selectOne(".C1")

  expect(resistor).not.toBeNull()
  expect(capacitor).not.toBeNull()

  const resistorPosition = resistor!._getGlobalPcbPositionBeforeLayout()
  const capacitorPosition = capacitor!._getGlobalPcbPositionBeforeLayout()

  expect(resistorPosition.x).toBeCloseTo(5, 1)
  expect(resistorPosition.y).toBeCloseTo(5, 1)

  expect(capacitorPosition.x).toBeCloseTo(-5, 1)
  expect(capacitorPosition.y).toBeCloseTo(-5, 1)

  const r1SmtpadPositions = circuit
    .selectAll(".R1 > smtpad")
    .map((elm) => elm._getGlobalPcbPositionBeforeLayout())

  expect(Math.abs(r1SmtpadPositions[0].x - 5)).toBeLessThan(1)
  expect(Math.abs(r1SmtpadPositions[1].x - 5)).toBeLessThan(1)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})

test("manual layout edits inside positioned group use absolute manual center", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="40mm"
      height="20mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: ".C1",
            center: { x: 11.4, y: 4.3 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <group name="region" pcbX={16} pcbY={0}>
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{ pin1: "VCC", pin8: "GND" }}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          connections={{ pin1: "U1.VCC", pin2: "U1.GND" }}
        />
      </group>
    </board>,
  )

  circuit.render()

  const capacitor = circuit.selectOne(".C1")
  expect(capacitor).not.toBeNull()

  const capacitorPosition = capacitor!._getGlobalPcbPositionBeforeLayout()

  expect(capacitorPosition.x).toBeCloseTo(11.4, 1)
  expect(capacitorPosition.y).toBeCloseTo(4.3, 1)
})
