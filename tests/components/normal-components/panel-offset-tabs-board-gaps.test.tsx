import { expect, test } from "bun:test"
import { getManifoldModule } from "@tscircuit/manifold-2d"
import type { PcbBoard } from "circuit-json"
import { generatePanelTabsAndMouseBites } from "lib/utils/panels/generate-panel-tabs-and-mouse-bites"
import { getPanelMaterial } from "tests/fixtures/get-panel-material"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("offset tabs span overlapping routing channels at different gaps and board scales", async () => {
  const { CrossSection } = await getManifoldModule()
  for (const scale of [0.7, 1]) {
    for (const boardGap of [2, 3, 4, 5]) {
      const separation = 20 * scale + boardGap
      const dimensions = [
        { width: 20, height: 20, x: 0, y: 0 },
        { width: 20, height: 34, x: -separation, y: 7 * scale },
        { width: 20, height: 34, x: separation, y: -7 * scale },
        { width: 34, height: 20, x: 7 * scale, y: separation },
        { width: 34, height: 20, x: -7 * scale, y: -separation },
      ]
      const { circuit } = getTestFixture()
      circuit.add(
        <panel
          width={90}
          height={90}
          panelizationMethod="tab-routing"
          boardGap={boardGap}
        >
          {dimensions.map(({ width, height, x, y }, boardIndex) => (
            <board
              key={boardIndex}
              width={width * scale}
              height={height * scale}
              pcbX={x}
              pcbY={y}
              routingDisabled
            >
              <pcbnotetext
                text={boardIndex === 0 ? "SUPPORTED CENTER" : "OFFSET TABS"}
                fontSize={scale}
              />
            </board>
          ))}
        </panel>,
      )
      await circuit.renderUntilSettled()
      if (scale === 0.7 && boardGap === 2)
        await expect(circuit).toMatchPcbSnapshot(import.meta.path)
      const boards: PcbBoard[] = circuit.db.pcb_board.list()
      const { tabCutouts, mouseBiteHoles } = generatePanelTabsAndMouseBites(
        boards,
        {
          boardGap,
          tabWidth: 2,
          tabLength: 5,
          mouseBites: true,
        },
      )
      const material = await getPanelMaterial(
        circuit.db.pcb_panel.list()[0]!,
        tabCutouts,
        mouseBiteHoles,
      )
      const regions = material.decompose().sort((a, b) => b.area() - a.area())
      const centerProbe = CrossSection.square(1, true)
      const attachedCenter = regions[0]!.intersect(centerProbe)
      expect(attachedCenter.area()).toBeCloseTo(1, 6)
      attachedCenter.delete()
      centerProbe.delete()
      for (const region of regions) region.delete()
      material.delete()
    }
  }
})
