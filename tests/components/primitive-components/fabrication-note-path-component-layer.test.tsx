import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabrication note path respects its parent component layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        layer="bottom"
        footprint={
          <footprint>
            <fabricationnotepath
              route={[
                { x: -2, y: -1 },
                { x: 2, y: -1 },
                { x: 0, y: 2 },
                { x: -2, y: -1 },
              ]}
              strokeWidth={0.2}
            />
            <silkscreentext text="BOTTOM FAB PATH" pcbY={-2} fontSize={0.5} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const fabricationNotePath = circuit.db.pcb_fabrication_note_path.list()[0]
  expect(fabricationNotePath?.layer).toBe("bottom")

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
