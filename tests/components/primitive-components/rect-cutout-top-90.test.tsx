import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular cutout preserves bounds at 90 degrees on top", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={8} routingDisabled schAutoLayoutEnabled>
      <chip
        name="U1"
        layer="top"
        pcbRotation={90}
        footprint={
          <footprint>
            <cutout shape="rect" width={4} height={1} />
          </footprint>
        }
      />
      <pcbnotetext text="top: 90 degrees" pcbY={-3} fontSize={0.5} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const cutout = circuit.db.pcb_cutout.list()[0]!
  if (cutout.shape !== "rect") throw new Error("Expected rectangular cutout")
  expect(((cutout.rotation! % 180) + 180) % 180).toBeCloseTo(90)
  expect(cutout.width).toBe(4)
  expect(cutout.height).toBe(1)
  const bounds = circuit.selectOne("cutout")!._getPcbCircuitJsonBounds()
  expect(bounds.width).toBeCloseTo(1)
  expect(bounds.height).toBeCloseTo(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbNotes: true })
})
