import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen text preserves an explicit zero-degree rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="18mm">
      <chip
        name="U1"
        pcbRotation="90deg"
        footprint={
          <footprint>
            <silkscreentext
              text="EXPLICIT 0deg"
              pcbY={3}
              pcbRotation="0deg"
              fontSize={0.7}
            />
            <silkscreentext text="INHERITED 90deg" pcbY={-3} fontSize={0.7} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(
    circuit.db.pcb_silkscreen_text
      .list()
      .map((silkscreenText) => silkscreenText.ccw_rotation),
  ).toEqual([0, 90])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
