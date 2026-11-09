import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduces unrouted disjoint pair sections on shared nets", async () => {
  const { circuit } = getTestFixture()
  const board = (routingDisabled: boolean) => (
    <board
      width={28}
      height={18}
      routingDisabled={routingDisabled}
      schematicDisabled
      autorouter="auto_local"
      minTraceWidth={0.15}
      minTraceToPadEdgeClearance={0.1}
    >
      <chip
        name="A"
        footprint={differentialPairPathPads("pin8", "pin7")}
        pcbX={-8}
        pcbY={3}
      />
      <chip
        name="B"
        footprint={differentialPairPathPads()}
        pcbX={-2}
        pcbY={3}
      />
      <chip
        name="C"
        footprint={differentialPairPathPads("pin8", "pin7")}
        pcbX={2}
        pcbY={0}
      />
      <chip name="D" footprint={differentialPairPathPads()} pcbX={8} pcbY={0} />
      <trace
        name="P_AB"
        routingPhaseIndex={0}
        path={[".A > .pin8", ".B > .pin1", "net.P"]}
      />
      <trace
        name="N_AB"
        routingPhaseIndex={0}
        path={[".A > .pin7", ".B > .pin2", "net.N"]}
      />
      <trace
        name="P_CD"
        routingPhaseIndex={1}
        path={[".C > .pin8", ".D > .pin1", "net.P"]}
      />
      <trace
        name="N_CD"
        routingPhaseIndex={1}
        path={[".C > .pin7", ".D > .pin2", "net.N"]}
      />
      <differentialpair
        name="AB"
        positiveConnection=".A > .pin8"
        negativeConnection="N_AB"
        pcbTraceGap={0.85}
      />
      <differentialpair
        name="CD"
        positiveConnection="P_CD"
        negativeConnection="N_CD"
        pcbTraceGap={0.85}
      />
      <autoroutingphase
        name="FIRST_PAIR"
        phaseIndex={0}
        autorouter="auto_local"
      />
      <autoroutingphase
        name="SECOND_PAIR"
        phaseIndex={1}
        autorouter="auto_local"
      />
      <pcbnotetext
        pcbY={7}
        text="Disjoint pairs: A-B and C-D must also connect to each other"
        fontSize={0.45}
      />
      <pcbnotetext pcbX={-8} pcbY={4.5} text="A P/N" fontSize={0.4} />
      <pcbnotetext pcbX={-2} pcbY={4.5} text="B P/N" fontSize={0.4} />
      <pcbnotetext pcbX={2} pcbY={1.5} text="C P/N" fontSize={0.4} />
      <pcbnotetext pcbX={8} pcbY={1.5} text="D P/N" fontSize={0.4} />
      <pcbnotetext
        pcbY={-3}
        text="Two pair sections + two bridges: both shared nets remain connected."
        fontSize={0.4}
      />
      <pcbnotetext
        pcbY={-4.5}
        text={
          '<trace name="P_AB" routingPhaseIndex={0} path={[".A > .pin8", ".B > .pin1", "net.P"]} />'
        }
        fontSize={0.35}
      />
      <pcbnotetext
        pcbY={-5.5}
        text={
          '<trace name="P_CD" routingPhaseIndex={1} path={[".C > .pin8", ".D > .pin1", "net.P"]} />'
        }
        fontSize={0.35}
      />
      <pcbnotetext
        pcbY={-6.5}
        text="N follows the same paths on net.N. AB and CD are differential pairs."
        fontSize={0.35}
      />
    </board>
  )
  circuit.add(board(true))
  circuit.render()
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    }),
  ).toThrow(
    'Could not find an SRJ connection for trace name or port selector ".A > .pin8" in differential pair "AB"',
  )
  const { circuit: routed } = getTestFixture()
  const asyncErrors: string[] = []
  routed.on("asyncEffect:end", (event) => {
    if (event.error) asyncErrors.push(String(event.error))
  })
  routed.add(board(false))
  await routed.renderUntilSettled()
  expect(asyncErrors).toEqual([
    'Error: Could not find an SRJ connection for trace name or port selector ".A > .pin8" in differential pair "AB"',
  ])
  expect(routed.db.pcb_trace.list()).toHaveLength(0)
  // Snapshot the actual failed render without asking the helper to rerender it.
  await expect(routed.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 800,
    showDebugObjects: false,
  })
}, 30_000)
