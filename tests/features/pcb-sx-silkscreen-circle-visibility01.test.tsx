import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("repro: board visibility is ignored by silkscreen circles", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="24mm"
      height="10mm"
      pcbSx={{ "& silkscreencircle": { visibility: "hidden" } }}
    >
      <silkscreencircle radius={0.7} pcbX={-8} pcbY={1} />
      <group pcbX={0} pcbY={0}>
        <silkscreencircle radius={0.7} pcbX={-3} pcbY={1} />
      </group>
      <group
        pcbX={0}
        pcbY={0}
        pcbSx={{ "& silkscreencircle": { visibility: "visible" } }}
      >
        <silkscreencircle radius={0.7} pcbX={3} pcbY={1} />
      </group>
      <silkscreencircle
        radius={0.7}
        pcbX={8}
        pcbY={1}
        pcbSx={{ "& silkscreencircle": { visibility: "visible" } }}
      />
      <pcbnotetext text="Board: hidden" pcbX={-8} pcbY={-1} fontSize={0.5} />
      <pcbnotetext text="Nested: hidden" pcbX={-3} pcbY={-1} fontSize={0.5} />
      <pcbnotetext text="Group: visible" pcbX={3} pcbY={-1} fontSize={0.5} />
      <pcbnotetext text="Own: visible" pcbX={8} pcbY={-1} fontSize={0.5} />
    </board>,
  )

  circuit.render()

  // Capture the bug: only the two visible overrides should remain.
  expect(circuit.db.pcb_silkscreen_circle.list()).toHaveLength(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
