import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular hole ignores footprint rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={12} routingDisabled>
      <chip
        name="J1"
        pcbRotation={90}
        footprint={
          <footprint>
            <hole shape="rect" width={6} height={2} />
            <silkscreenrect width={6} height={2} strokeWidth={0.15} />
          </footprint>
        }
      />
      <pcbnotetext
        text="90 DEG: HOLE SHOULD FOLLOW YELLOW OUTLINE"
        pcbY={4.5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
