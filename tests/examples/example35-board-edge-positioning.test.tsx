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
          text="pcbLeftEdgeX, pcbRightEdgeX, pcbTopEdgeY, pcbBottomEdgeY"
          fontSize={2}
          anchorAlignment="center"
        />
        <pcbnotedimension
          from={{ x: -45, y: 20 }}
          to={{ x: -40, y: 20 }}
          text="anchor"
          fontSize={1.6}
          arrowSize={0.8}
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
          text="pcbLeftEdgeX, pcbTopEdgeY, width, height"
          fontSize={2}
          anchorAlignment="center"
        />
        <pcbnotedimension
          from={{ x: 10, y: 30 }}
          to={{ x: 15, y: 30 }}
          text="anchor"
          fontSize={1.6}
          arrowSize={0.8}
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
          text="pcbRightEdgeX, pcbBottomEdgeY, width, height"
          fontSize={2}
          anchorAlignment="center"
        />
        <pcbnotedimension
          from={{ x: -30, y: -30 }}
          to={{ x: -25, y: -30 }}
          text="anchor"
          fontSize={1.6}
          arrowSize={0.8}
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
          text="pcbLeftEdgeX, pcbRightEdgeX, pcbBottomEdgeY, height"
          fontSize={2}
          anchorAlignment="center"
        />
        <pcbnotedimension
          from={{ x: 30, y: -25 }}
          to={{ x: 35, y: -25 }}
          text="anchor"
          fontSize={1.6}
          arrowSize={0.8}
        />
      </board>
    </panel>,
  )

  await circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
