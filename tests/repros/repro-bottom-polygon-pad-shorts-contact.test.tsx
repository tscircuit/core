import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
beforeAll(async () => {
  circuit.add(
    <board width={24} height={13} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).map((layer, i) => (
        <chip
          key={layer}
          name={`J${i + 1}`}
          pcbX={i === 0 ? -6 : 6}
          layer={layer}
          cadModel={null}
          pinLabels={{ pin1: "VCC", pin2: "GND" }}
          footprint={
            <footprint>
              <platedhole
                shape="hole_with_polygon_pad"
                holeShape="circle"
                holeDiameter={0.6}
                holeOffsetX={0}
                holeOffsetY={0}
                padOutline={[
                  { x: -0.6, y: -0.8 },
                  { x: 3, y: -0.8 },
                  { x: 3, y: 0.8 },
                  { x: -0.6, y: 0.8 },
                ]}
                portHints={["pin1"]}
              />
              <platedhole
                shape="circle"
                holeDiameter={0.4}
                outerDiameter={0.8}
                pcbX={-1.8}
                portHints={["pin2"]}
              />
              <silkscreenpath
                route={[
                  { x: -0.8, y: -1 },
                  { x: 3.2, y: -1 },
                  { x: 3.2, y: 1 },
                  { x: -0.8, y: 1 },
                  { x: -0.8, y: -1 },
                ]}
                strokeWidth={0.07}
              />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        text="TOP: two separate contacts"
        pcbX={-6}
        pcbY={4.5}
        fontSize={0.55}
      />
      <pcbnotetext
        text="BOTTOM: contacts overlap"
        pcbX={6}
        pcbY={4.5}
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const holes = circuit.db.pcb_plated_hole.list()
  expect(holes).toHaveLength(4)
  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "source_failed_to_create_component_error"),
  ).toHaveLength(0)
  const top = holes[0]
  if (top.shape !== "hole_with_polygon_pad") throw new Error("Wrong shape")
  // The authored top-side copper leaves 0.8 mm of space to pin 2.
  const controlGap = Math.min(...top.pad_outline.map((p) => p.x)) - (-1.8 + 0.4)
  expect(controlGap).toBeCloseTo(0.8)
}, 30_000)

test.failing(
  "flipping an asymmetric plated pad preserves separation between contacts",
  () => {
    expect(
      circuit
        .getCircuitJson()
        .filter((e) => e.type === "pcb_pad_pad_clearance_error"),
    ).toHaveLength(0)
  },
)
