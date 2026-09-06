import { beforeAll, describe, expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import FullGameboyBoard from "./assets/full-gameboy-current-source/experiments/fabrication/placement-storage-sd-detect.circuit"

const isRoutingError = (element: AnyCircuitElement): boolean =>
  element.type === "pcb_autorouting_error" ||
  (element.type.endsWith("_error") &&
    (element.type.includes("trace") || element.type.includes("via")))

describe("full Game Boy Advance Pipeline 9 routing repro", () => {
  let routingErrors: AnyCircuitElement[] = []

  beforeAll(async () => {
    const { circuit: unroutedCircuit } = getTestFixture({
      platform: {
        placementDrcChecksDisabled: true,
        routingDisabled: true,
        schematicDisabled: true,
      },
    })
    unroutedCircuit.add(<FullGameboyBoard />)
    await unroutedCircuit.renderUntilSettled()
    await expect(unroutedCircuit).toMatchPcbSnapshot(
      `${import.meta.path}-unrouted`,
    )

    const { circuit } = getTestFixture({
      platform: {
        placementDrcChecksDisabled: true,
        schematicDisabled: true,
      },
    })
    const autoroutingPhases = createAutoroutingPhaseIoStack(circuit)
    circuit.add(<FullGameboyBoard />)

    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(autoroutingPhases).toHaveLength(1)
    const routingPhase = autoroutingPhases[0]
    if (!routingPhase?.startSimpleRouteJson) {
      throw new Error("Expected a captured autorouting phase input")
    }
    expect(routingPhase.startSimpleRouteJson.connections).toHaveLength(145)
    expect(routingPhase.startSimpleRouteJson.obstacles).toHaveLength(411)
    expect(routingPhase.startSimpleRouteJson.layerCount).toBe(4)
    expect(routingPhase.startSimpleRouteJson.traces ?? []).toEqual([])

    await expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-routed`)
    routingErrors = circuit.getCircuitJson().filter(isRoutingError)
  }, 600_000)

  test.failing(
    "the fully routed board should have no routing DRC errors",
    () => {
      expect(routingErrors).toEqual([])
    },
  )
})
