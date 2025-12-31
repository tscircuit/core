import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board edge props set board placement", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="200mm" height="120mm" panelizationMethod="none">
      <board
        pcbLeftEdgeX={-60}
        pcbRightEdgeX={-30}
        pcbTopEdgeY={30}
        pcbBottomEdgeY={10}
        routingDisabled
      >
        <pcbnotetext
          pcbX={-45}
          pcbY={38}
          text="left/right/top/bottom"
          fontSize={2}
          anchorAlignment="center"
        />
      </board>
      <board
        pcbLeftEdgeX={10}
        pcbTopEdgeY={30}
        width="25mm"
        height="15mm"
        routingDisabled
      >
        <pcbnotetext
          pcbX={22.5}
          pcbY={38}
          text="left/top + width/height"
          fontSize={2}
          anchorAlignment="center"
        />
      </board>
      <board
        pcbRightEdgeX={-30}
        pcbBottomEdgeY={-30}
        width="20mm"
        height="12mm"
        routingDisabled
      >
        <pcbnotetext
          pcbX={-40}
          pcbY={-8}
          text="right/bottom + width/height"
          fontSize={2}
          anchorAlignment="center"
        />
      </board>
      <board
        pcbLeftEdgeX={15}
        pcbRightEdgeX={45}
        pcbBottomEdgeY={-25}
        height="18mm"
        routingDisabled
      >
        <pcbnotetext
          pcbX={30}
          pcbY={-8}
          text="left/right + bottom + height"
          fontSize={2}
          anchorAlignment="center"
        />
      </board>
    </panel>,
  )

  await circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
