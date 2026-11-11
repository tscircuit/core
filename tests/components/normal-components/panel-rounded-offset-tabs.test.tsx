import { expect, test } from "bun:test"
import { Polygon, point } from "@flatten-js/core"
import { getManifoldModule } from "@tscircuit/manifold-2d"
import { generatePanelTabsAndMouseBites } from "lib/utils/panels/generate-panel-tabs-and-mouse-bites"
import { getPanelMaterial } from "tests/fixtures/get-panel-material"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  applyToPoint,
  compose,
  inverse,
  rotateDEG,
  translate,
} from "transformation-matrix"

test("curved outlines preserve offset tabs in either winding and every quarter turn", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel width={100} height={80} panelizationMethod="tab-routing">
      <subpanel pcbX={10} pcbY={8}>
        <board
          width={20}
          height={20}
          borderRadius={2}
          pcbX={0}
          pcbY={0}
          routingDisabled
        >
          <pcbnotetext text="CURVED TAB" fontSize={1} />
        </board>
        <board
          width={20}
          height={34}
          borderRadius={2}
          pcbX={22}
          pcbY={7}
          routingDisabled
        >
          <pcbnotetext text="OFFSET EDGE" fontSize={1} />
        </board>
      </subpanel>
    </panel>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const boards = circuit.db.pcb_board.list()
  const { CrossSection } = await getManifoldModule()
  // Transform emitted world positions, including the subpanel translation.
  // The patch is midway across the first board's right-hand tab, away from drills.
  for (const reverseWinding of [false, true]) {
    for (const ccwRotationDegrees of [0, 37, 90, 180, 270]) {
      const circuitWorldToTestWorldTransform = compose(
        translate(60, -35),
        rotateDEG(ccwRotationDegrees),
      )
      const testWorldToCircuitWorldTransform = inverse(
        circuitWorldToTestWorldTransform,
      )
      const transformedBoards = boards.map((board) => {
        const outline = board.outline!.map((position) =>
          applyToPoint(circuitWorldToTestWorldTransform, position),
        )
        return {
          ...board,
          center: applyToPoint(circuitWorldToTestWorldTransform, board.center),
          outline: reverseWinding ? outline.reverse() : outline,
        }
      })
      for (const mouseBites of [false, true]) {
        const { tabCutouts, mouseBiteHoles } = generatePanelTabsAndMouseBites(
          transformedBoards,
          {
            boardGap: 2,
            tabWidth: 2,
            tabLength: 5,
            mouseBites,
          },
        )
        if (mouseBites) {
          const circuitWorldDrills = mouseBiteHoles.map((hole) =>
            applyToPoint(testWorldToCircuitWorldTransform, hole),
          )
          const boardEdgeX = boards[0]!.center.x + boards[0]!.width! / 2
          const boardEdgeRow = circuitWorldDrills.filter(
            (position) =>
              Math.abs(position.x - boardEdgeX) < 1e-6 &&
              Math.abs(position.y - boards[0]!.center.y) < 3,
          )
          const neighboringEdgeRow = circuitWorldDrills.filter(
            (position) =>
              Math.abs(position.x - boardEdgeX - 2) < 1e-6 &&
              Math.abs(position.y - boards[0]!.center.y) < 3,
          )
          expect(boardEdgeRow).toHaveLength(4)
          expect(
            neighboringEdgeRow
              .map((position) => Number(position.y.toFixed(6)))
              .sort(),
          ).toEqual(
            boardEdgeRow
              .map((position) => Number(position.y.toFixed(6)))
              .sort(),
          )
        } else {
          expect(mouseBiteHoles).toHaveLength(0)
        }
        const material = await getPanelMaterial({
          panel: {
            ...circuit.db.pcb_panel.list()[0]!,
            center: { x: 60, y: -35 },
            width: 200,
            height: 200,
          },
          cutouts: tabCutouts,
          holes: mouseBiteHoles,
        })
        const bridgeCenter = applyToPoint(circuitWorldToTestWorldTransform, {
          x: boards[0]!.center.x + 11,
          y: boards[0]!.center.y,
        })
        const probe = CrossSection.square(0.5, true).translate(
          bridgeCenter.x,
          bridgeCenter.y,
        )
        const bridgeMaterial = material.intersect(probe)
        expect(bridgeMaterial.area()).toBeCloseTo(0.25, 6)
        for (const cutout of tabCutouts) {
          expect(cutout.shape).toBe("polygon")
          if (cutout.shape === "polygon") {
            expect(
              new Polygon(
                cutout.points.map(({ x, y }) => point(x, y)),
              ).isValid(),
            ).toBe(true)
          }
        }
        bridgeMaterial.delete()
        probe.delete()
        material.delete()
      }
    }
  }
})
