import { expect, test } from "bun:test"
import type { PCBKeepout } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { PcbComponentId } from "lib/utils/circuit-json/circuit-json-id-types"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type PCBKeepoutWithExclusions = PCBKeepout & {
  excluded_pcb_component_ids?: PcbComponentId[]
}

test("keepout excludeRefs serializes selected PCB component IDs without weakening the obstacle", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="12mm">
      <pcbnotetext
        text="ANT1 is DRC-exempt; keepout remains a hard routing obstacle"
        pcbX={-10}
        pcbY={5}
        fontSize={0.5}
        anchorAlignment="top_left"
      />
      <testpoint
        name="ANT1"
        footprintVariant="pad"
        schX={3}
        schY={1}
        pcbX={4}
        pcbY={0}
      />
      <testpoint
        name="OTHER"
        footprintVariant="pad"
        schX={-3}
        schY={-1}
        pcbX={-4}
        pcbY={0}
      />
      <keepout
        shape="rect"
        width="8mm"
        height="6mm"
        pcbX={4}
        pcbY={0}
        excludeRefs={[".ANT1"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild
  if (!board) throw new Error("Expected a board component")

  const antennaSourceComponent = circuit.db.source_component.getWhere({
    name: "ANT1",
  })
  const antennaPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: antennaSourceComponent!.source_component_id,
  })
  const otherSourceComponent = circuit.db.source_component.getWhere({
    name: "OTHER",
  })
  const otherPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: otherSourceComponent!.source_component_id,
  })
  const keepout = circuit.db.pcb_keepout.list()[0] as
    | PCBKeepoutWithExclusions
    | undefined

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: keepout!.subcircuit_id,
    subcircuitComponent: board,
  })
  const keepoutObstacle = simpleRouteJson.obstacles.find(
    (obstacle) =>
      obstacle.center.x === keepout!.center.x &&
      obstacle.center.y === keepout!.center.y &&
      obstacle.width === 8 &&
      obstacle.height === 6,
  )

  expect(keepout?.excluded_pcb_component_ids).toEqual([
    antennaPcbComponent!.pcb_component_id,
  ])
  expect(keepout?.excluded_pcb_component_ids).not.toContain(
    otherPcbComponent!.pcb_component_id,
  )
  expect(keepoutObstacle?.connectedTo).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
