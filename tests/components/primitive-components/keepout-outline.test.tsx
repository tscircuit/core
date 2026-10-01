import { expect, test } from "bun:test"
import type { PCBKeepout } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepout preserves transformed outline geometry and rules", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" layers={4}>
      <pcbnotetext
        pcbY={5}
        text="OUTLINE KEEPOUT / BOTTOM / ROTATED"
        fontSize={0.7}
      />
      <chip
        name="U1"
        layer="bottom"
        pcbX={2}
        pcbY={-1}
        pcbRotation="90deg"
        noSchematicRepresentation
        footprint={
          <footprint>
            <keepout
              shape="outline"
              outline={[
                { x: -3, y: -2 },
                { x: 3, y: -2 },
                { x: 3, y: 2 },
                { x: -3, y: 2 },
                { x: -3, y: -2 },
              ]}
              strokeWidth="0.8mm"
              layers={["top", "inner1"]}
              allowTraces
              allowPlacements={false}
              warningOnly
              description="Imported outline keepout"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const outlineKeepout = circuit
    .getCircuitJson()
    .find(
      (element): element is PCBKeepout =>
        element.type === "pcb_keepout" && element.shape === "outline",
    )
  expect(outlineKeepout).toBeDefined()
  expect(outlineKeepout).toMatchObject({
    allow_placements: false,
    allow_traces: true,
    description: "Imported outline keepout",
    layers: ["bottom", "inner1"],
    shape: "outline",
    stroke_width: 0.8,
    warning_only: true,
  })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
