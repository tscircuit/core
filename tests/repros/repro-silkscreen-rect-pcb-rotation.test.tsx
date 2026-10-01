import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: silkscreenrect pcbRotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={64} height={14}>
      <pcbnotetext
        pcbY={5.5}
        fontSize={1.2}
        text="Expected rectangle rotation (CCW)"
      />

      <pcbnotetext pcbX={-24} pcbY={4} fontSize={1.1} text="30 deg" />
      <silkscreenrect
        width={6}
        height={2}
        // @ts-expect-error pcbRotation is missing from the current props types.
        pcbRotation={30}
        pcbX={-24}
        filled={false}
      />

      <pcbnotetext pcbX={-12} pcbY={4} fontSize={1.1} text="45 deg" />
      <silkscreenrect
        width={6}
        height={2}
        // @ts-expect-error pcbRotation is missing from the current props types.
        pcbRotation={45}
        pcbX={-12}
        filled={false}
      />

      <pcbnotetext pcbX={0} pcbY={4} fontSize={1.1} text="0 deg" />
      <silkscreenrect
        width={6}
        height={2}
        // @ts-expect-error pcbRotation is missing from the current props types.
        pcbRotation={0}
        pcbX={0}
        filled={false}
      />

      <pcbnotetext pcbX={12} pcbY={4} fontSize={1.1} text="90 deg" />
      <silkscreenrect
        width={6}
        height={2}
        // @ts-expect-error pcbRotation is missing from the current props types.
        pcbRotation={90}
        pcbX={12}
        filled={false}
      />

      <pcbnotetext pcbX={24} pcbY={4} fontSize={1.1} text="180 deg" />
      <silkscreenrect
        width={6}
        height={2}
        // @ts-expect-error pcbRotation is missing from the current props types.
        pcbRotation={180}
        pcbX={24}
        filled={false}
      />
    </board>,
  )
  circuit.render()

  // Captures the bug: 30/45-degree rectangles stay horizontal. The 0/90/180-degree
  // controls already look correct. Update the snapshot after fixing rotation.
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
