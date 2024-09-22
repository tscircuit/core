import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with manual footprint flips when layer is set to bottom", async () => {
  const { project } = getTestFixture()

  const footprint = (
    <footprint>
      <smtpad
        shape="rect"
        width="0.5mm"
        height="0.5mm"
        pcbX={1}
        pcbY={1}
        portHints={["1"]}
      />
      <smtpad
        shape="rect"
        width="0.3mm"
        height="0.3mm"
        pcbX={1}
        pcbY={-1}
        portHints={["2"]}
      />
      <smtpad
        shape="rect"
        width="0.1mm"
        height="0.1mm"
        pcbX={-0.5}
        pcbY={0.1}
        portHints={["3"]}
      />
      <silkscreentext
        pcbX={1}
        pcbY={0}
        anchorAlignment="center"
        fontSize={0.2}
        text="hi"
      />
    </footprint>
  )

  project.add(
    <board width="7mm" height="3mm">
      <chip name="U1" pcbX={-2} layer="bottom" footprint={footprint} />
      <chip name="U2" pcbX={2} layer="top" footprint={footprint} />
    </board>,
  )

  project.render()

  // Check if all SMT pads are on the bottom layer
  const smtPads = project.db.pcb_smtpad
    .list()
    .filter((pad) => pad.layer === "bottom")
  expect(smtPads.length).toBe(3)

  // Check if the positions are mirrored
  const padPositions = smtPads.map((pad) => ({ x: pad.x, y: pad.y }))
  expect(padPositions).toContainEqual({ x: -3, y: 1 })
  expect(padPositions).toContainEqual({ x: -3, y: -1 })

  // Use snapshot to verify the overall layout
  expect(project).toMatchPcbSnapshot(import.meta.path)
})
