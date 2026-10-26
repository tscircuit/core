import { expect, test } from "bun:test"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { stitchCourtyardOutlines } from "lib/utils/stitchCourtyardOutlines"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stitchCourtyardOutlines stitches 4 segments into a 4-point polygon", () => {
  const segments = [
    {
      type: "pcb_courtyard_outline" as const,
      pcb_courtyard_outline_id: "c1",
      layer: "top" as const,
      outline: [
        { x: -5, y: -2 },
        { x: 5, y: -2 },
      ],
    },
    {
      type: "pcb_courtyard_outline" as const,
      pcb_courtyard_outline_id: "c2",
      layer: "top" as const,
      outline: [
        { x: 5, y: -2 },
        { x: 5, y: 2 },
      ],
    },
    {
      type: "pcb_courtyard_outline" as const,
      pcb_courtyard_outline_id: "c3",
      layer: "top" as const,
      outline: [
        { x: 5, y: 2 },
        { x: -5, y: 2 },
      ],
    },
    {
      type: "pcb_courtyard_outline" as const,
      pcb_courtyard_outline_id: "c4",
      layer: "top" as const,
      outline: [
        { x: -5, y: 2 },
        { x: -5, y: -2 },
      ],
    },
  ]

  const stitched = stitchCourtyardOutlines(segments)
  expect(stitched.length).toBe(1)
  expect(stitched[0]!.outline.length).toBe(4)
  expect(stitched[0]!.layer).toBe("top")
})

test("createComponentsFromCircuitJson stitches 4 courtyard outline segments into a single CourtyardOutline component", () => {
  const elements = [
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "c1",
      layer: "top",
      outline: [
        { x: -5, y: -2 },
        { x: 5, y: -2 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "c2",
      layer: "top",
      outline: [
        { x: 5, y: -2 },
        { x: 5, y: 2 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "c3",
      layer: "top",
      outline: [
        { x: 5, y: 2 },
        { x: -5, y: 2 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "c4",
      layer: "top",
      outline: [
        { x: -5, y: 2 },
        { x: -5, y: -2 },
      ],
    },
  ] as any

  const components = createComponentsFromCircuitJson(
    {
      componentName: "U1",
      componentRotation: "0deg",
    },
    elements,
  )

  const courtyardOutlines = components.filter(
    (c) => c.constructor.name === "CourtyardOutline",
  )
  expect(courtyardOutlines.length).toBe(1)
  expect((courtyardOutlines[0] as any).props.outline.length).toBe(4)
})

test("board with 4 courtyard outline segments completes placement check without error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm">
      <chip name="U1" pcbX={-7} pcbY={0}>
        <courtyardoutline
          layer="top"
          outline={[
            { x: -5, y: -2 },
            { x: 5, y: -2 },
          ]}
        />
        <courtyardoutline
          layer="top"
          outline={[
            { x: 5, y: -2 },
            { x: 5, y: 2 },
          ]}
        />
        <courtyardoutline
          layer="top"
          outline={[
            { x: 5, y: 2 },
            { x: -5, y: 2 },
          ]}
        />
        <courtyardoutline
          layer="top"
          outline={[
            { x: -5, y: 2 },
            { x: -5, y: -2 },
          ]}
        />
      </chip>
    </board>,
  )
  await circuit.renderUntilSettled()
  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingErrors.length).toBe(0)
})
