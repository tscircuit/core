import { expect, test } from "bun:test"
import "tests/fixtures/extend-expect-any-svg"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  H3RoutingPhaseIntentBoard,
  type NativeH3Source,
} from "tests/fixtures/h3-routing-phase-intent/board"
import { getH3RoutingPhaseIntentSnapshot } from "tests/fixtures/h3-routing-phase-intent/snapshot"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("native H3 byte 0 routing input omits later phase intent", async () => {
  const fixtureBytes = readFileSync(
    new URL(
      "../fixtures/h3-routing-phase-intent/source.json.gz",
      import.meta.url,
    ),
  )
  expect(createHash("sha256").update(fixtureBytes).digest("hex")).toBe(
    "5eb3790b04c95ea93001e979bc8d4823b43573532d899a94588a946a5176a209",
  )
  const source: NativeH3Source = JSON.parse(
    gunzipSync(fixtureBytes).toString("utf8"),
  )
  const { circuit } = getTestFixture()
  const capturedPhaseInputs: SimpleRouteJson[] = []
  const stopAfterCapture =
    "Stopped deliberately after capturing the H3 byte 0 request"
  circuit.add(
    <H3RoutingPhaseIntentBoard
      source={source}
      captureFirstPhase={async (simpleRouteJson) => {
        capturedPhaseInputs.push(structuredClone(simpleRouteJson))
        throw new Error(stopAfterCapture)
      }}
    />,
  )
  await circuit.renderUntilSettled()

  expect(capturedPhaseInputs).toHaveLength(1)
  const phaseSimpleRouteJson = capturedPhaseInputs[0]!
  expect(phaseSimpleRouteJson.connections).toHaveLength(8)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(445)
  expect(circuit.db.source_net.list()).toHaveLength(53)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)
  expect(
    circuit.db.pcb_autorouting_error.list().map((error) => error.message),
  ).toEqual([stopAfterCapture])
  expect(phaseSimpleRouteJson).not.toHaveProperty("pendingRoutingAccess")

  await expect(
    getH3RoutingPhaseIntentSnapshot({
      circuitJson: circuit.getCircuitJson(),
      phaseSimpleRouteJson,
      pendingConnections: [],
    }),
  ).toMatchSvgSnapshot(import.meta.path, "h3-routing-phase-future-intent-pcb", {
    diffThresholdPercent: 0,
  })
}, 60_000)
