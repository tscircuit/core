import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

let missingPinSelectors: string[] = []

beforeAll(async () => {
  circuit.add(
    <board width={18} height={10} routingDisabled>
      <chip name="U1" schPinArrangement={{ rightSide: ["pin1"] }}>
        <footprint>
          {[-2, 2].map((pcbX) => (
            <platedhole
              key={pcbX}
              portHints={["pin2"]}
              pcbX={pcbX}
              shape="circle"
              holeDiameter={0.8}
              outerDiameter={1.4}
            />
          ))}
        </footprint>
      </chip>
      <trace from="U1.pin2" to="net.GND" />
      <pcbnotetext text="U1.pin2 to GND" pcbY={3.4} fontSize={0.7} />
      <pcbnotetext
        text="Both holes belong to the omitted pin2"
        pcbY={1.65}
        fontSize={0.55}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(2)

  missingPinSelectors = circuit.db.source_trace_not_connected_error
    .list()
    .flatMap((error) => error.selectors_not_found ?? [])

  circuit.db.pcb_note_text.insert({
    text: missingPinSelectors.length
      ? `Missing pin: ${missingPinSelectors.join(", ")}`
      : "No missing-pin error",
    // Board-space point in mm, in the right-handed top view with +X right,
    // +Y up, and +Z toward the viewer.
    anchor_position: { x: 0, y: -2.4 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.7,
  })

  // Keep snapshot failures outside the expected-failure test.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("a trace to omitted pin2 reports a missing-pin error", () => {
  expect(missingPinSelectors).toEqual(["U1.pin2"])
})
