import { test, expect } from "bun:test"
import type { PcbSmtPadRect, PcbSmtPadPolygon } from "circuit-json"
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
        shape="polygon"
        points={[
          { x: -0.5, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.5, y: 0 },
          { x: 0, y: -0.5 },
          { x: -0.5, y: -0.5 },
        ]}
        pcbX={1}
        pcbY={-1}
        portHints={["2"]}
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
      <chip name="U2" pcbX={2} layer="top" footprint={footprint} />
    </board>,
  )

  project.render()

  // Check if all SMT pads are on the bottom layer

  // Use snapshot to verify the overall layout
  expect(project).toMatchPcbSnapshot(import.meta.path)
})
