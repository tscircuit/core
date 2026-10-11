import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("group visibility hides only its circles and allows a visible child override", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="10mm">
      <silkscreencircle radius={0.7} pcbX={-7} pcbY={1} />
      <group
        pcbX={0}
        pcbY={0}
        pcbSx={{ "& silkscreencircle": { visibility: "hidden" } }}
      >
        <silkscreencircle radius={0.7} pcbX={0} pcbY={1} />
        <silkscreencircle
          radius={0.7}
          pcbX={7}
          pcbY={1}
          pcbSx={{ "& silkscreencircle": { visibility: "visible" } }}
        />
      </group>
      <pcbnotetext text="Default: visible" pcbX={-7} pcbY={-1} fontSize={0.5} />
      <pcbnotetext text="Group: hidden" pcbX={0} pcbY={-1} fontSize={0.5} />
      <pcbnotetext text="Own: visible" pcbX={7} pcbY={-1} fontSize={0.5} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_silkscreen_circle.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
