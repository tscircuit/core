import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board edge props set board placement", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="200mm" height="120mm" panelizationMethod="none">
      <board
        pcbLeftEdgeX={-90}
        pcbRightEdgeX={-50}
        pcbTopEdgeY={40}
        pcbBottomEdgeY={15}
        routingDisabled
      >
        <pcbnotetext
          pcbX={-90}
          pcbY={48}
          text={
            "<board pcbLeftEdgeX={-90} pcbRightEdgeX={-50} pcbTopEdgeY={40} pcbBottomEdgeY={15} />"
          }
          fontSize={2}
          anchorAlignment="top_left"
        />
        <pcbnotetext
          pcbX={-90}
          pcbY={12}
          text="anchor @ (-70, 27.5)"
          fontSize={1.6}
          anchorAlignment="top_left"
        />
      </board>
      <board
        pcbLeftEdgeX={30}
        pcbTopEdgeY={40}
        width="25mm"
        height="15mm"
        routingDisabled
      >
        <pcbnotetext
          pcbX={30}
          pcbY={48}
          text={
            '<board pcbLeftEdgeX={30} pcbTopEdgeY={40} width="25mm" height="15mm" />'
          }
          fontSize={2}
          anchorAlignment="top_left"
        />
        <pcbnotetext
          pcbX={30}
          pcbY={32}
          text="anchor @ (42.5, 32.5)"
          fontSize={1.6}
          anchorAlignment="top_left"
        />
      </board>
      <board
        pcbRightEdgeX={-50}
        pcbBottomEdgeY={-45}
        width="20mm"
        height="12mm"
        routingDisabled
      >
        <pcbnotetext
          pcbX={-90}
          pcbY={-22}
          text={
            '<board pcbRightEdgeX={-50} pcbBottomEdgeY={-45} width="20mm" height="12mm" />'
          }
          fontSize={2}
          anchorAlignment="top_left"
        />
        <pcbnotetext
          pcbX={-90}
          pcbY={-50}
          text="anchor @ (-60, -39)"
          fontSize={1.6}
          anchorAlignment="top_left"
        />
      </board>
      <board
        pcbLeftEdgeX={40}
        pcbRightEdgeX={90}
        pcbBottomEdgeY={-45}
        height="18mm"
        routingDisabled
      >
        <pcbnotetext
          pcbX={40}
          pcbY={-22}
          text={
            '<board pcbLeftEdgeX={40} pcbRightEdgeX={90} pcbBottomEdgeY={-45} height="18mm" />'
          }
          fontSize={2}
          anchorAlignment="top_left"
        />
        <pcbnotetext
          pcbX={40}
          pcbY={-50}
          text="anchor @ (65, -36)"
          fontSize={1.6}
          anchorAlignment="top_left"
        />
      </board>
    </panel>,
  )

  await circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
