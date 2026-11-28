import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: "A",
  pin2: "B",
  pin3: "C",
  pin4: "D",
  pin5: "E",
  pin6: "F",
  pin7: "G",
  pin8: "H",
}

test("schematicbox overlay updates bounds and title after schematic grid layout", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <group schGrid gridCols={2} gridGap={4}>
        <chip name="U1" pinLabels={pinLabels} />
        <chip name="U2" pinLabels={pinLabels} />
      </group>
      <schematicbox
        overlay={[
          ".U2 > .pin1",
          ".U2 > .pin2",
          ".U2 > .pin3",
          ".U2 > .pin4",
          ".U2 > .pin5",
          ".U2 > .pin6",
          ".U2 > .pin7",
          ".U2 > .pin8",
        ]}
        padding={0.4}
        title="U2 pins"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const u2Source = circuit.db.source_component
    .list()
    .find((c) => c.name === "U2")!
  const u2Sch = circuit.db.schematic_component
    .list()
    .find((c) => c.source_component_id === u2Source.source_component_id)!
  const u2Ports = circuit.db.schematic_port
    .list()
    .filter((p) => p.schematic_component_id === u2Sch.schematic_component_id)

  const minPortX = Math.min(...u2Ports.map((p) => p.center.x))
  const maxPortX = Math.max(...u2Ports.map((p) => p.center.x))
  const minPortY = Math.min(...u2Ports.map((p) => p.center.y))
  const maxPortY = Math.max(...u2Ports.map((p) => p.center.y))

  const boxes = circuit.db.schematic_box.list()
  expect(boxes).toHaveLength(1)
  const box = boxes[0]!

  expect(box.x).toBeCloseTo(minPortX - 0.4, 5)
  expect(box.y).toBeCloseTo(minPortY - 0.4, 5)
  expect(box.width).toBeCloseTo(maxPortX - minPortX + 0.8, 5)
  expect(box.height).toBeCloseTo(maxPortY - minPortY + 0.8, 5)

  const titleText = circuit.db.schematic_text
    .list()
    .find((t) => t.text === "U2 pins")!
  expect(titleText).toBeDefined()
  expect(titleText.position.x).toBeGreaterThanOrEqual(box.x)
  expect(titleText.position.x).toBeLessThanOrEqual(box.x + box.width)
})
