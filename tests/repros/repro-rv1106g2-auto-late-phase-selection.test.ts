import {
  convertSrjToGraphicsObject,
  type SimpleRouteJson as CapacityAutorouterSimpleRouteJson,
} from "@tscircuit/capacity-autorouter"
import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { stackSvgsVertically } from "stack-svgs"
import rv1106g2LatePhaseSrj from "tests/repros/assets/rv1106g2-phase-7-input.srj.json"

const SNAPSHOT_WIDTH = 800
const SNAPSHOT_HEIGHT = 600
const SNAPSHOT_TITLE_HEIGHT = 44
const LATE_PHASE_CONNECTION_COUNT = 4
const LATE_PHASE_OBSTACLE_COUNT = 389
const PRELOADED_TRACE_COUNT = 205

const createSnapshotTitleSvg = (title: string) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${SNAPSHOT_WIDTH}"
  height="${SNAPSHOT_TITLE_HEIGHT}"
  viewBox="0 0 ${SNAPSHOT_WIDTH} ${SNAPSHOT_TITLE_HEIGHT}"
>
  <rect width="${SNAPSHOT_WIDTH}" height="${SNAPSHOT_TITLE_HEIGHT}" fill="#121212" />
  <text
    x="${SNAPSHOT_WIDTH / 2}"
    y="28"
    fill="#f4f4f4"
    font-family="Arial, sans-serif"
    font-size="17"
    font-weight="700"
    text-anchor="middle"
  >${title}</text>
</svg>`

test("reproduces RV1106G2 auto selecting pipeline7 for a late phase with preloaded traces", async () => {
  const simpleRouteJson = rv1106g2LatePhaseSrj as SimpleRouteJson &
    CapacityAutorouterSimpleRouteJson
  const autoAutorouterConfig = getPresetAutoroutingConfig("auto")
  let solverName: string | undefined

  new TscircuitAutorouter(simpleRouteJson, {
    autorouterVersion: autoAutorouterConfig.autorouterVersion,
    onSolverStarted: (solverDetails) => {
      solverName = solverDetails.solverName
    },
  })

  expect(simpleRouteJson.connections).toHaveLength(LATE_PHASE_CONNECTION_COUNT)
  expect(simpleRouteJson.obstacles).toHaveLength(LATE_PHASE_OBSTACLE_COUNT)
  expect(simpleRouteJson.traces).toHaveLength(PRELOADED_TRACE_COUNT)

  // This is the reproduced bug: the exact input exhausts Pipeline7, while
  // beta_pipeline9 solves all four remaining connections around these traces.
  expect(solverName).toBe("AutoroutingPipelineSolver7_MultiGraph")

  const simpleRouteJsonSvg = getSvgFromGraphicsObject(
    convertSrjToGraphicsObject(simpleRouteJson),
    {
      backgroundColor: "#fff",
      hideInlineLabels: true,
      svgHeight: SNAPSHOT_HEIGHT,
      svgWidth: SNAPSHOT_WIDTH,
    },
  )
  const snapshotSvg = stackSvgsVertically(
    [
      createSnapshotTitleSvg(
        "RV1106G2 LATE PHASE: AUTO SELECTS PIPELINE7 WITH 205 PRELOADED TRACES",
      ),
      simpleRouteJsonSvg,
    ],
    { gap: 0, normalizeSize: false },
  )

  await expect(snapshotSvg).toMatchSvgSnapshot(import.meta.path)
})
