import { beforeAll, describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import type { AnyCircuitElement, CircuitJson, PcbBoard } from "circuit-json"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import fullGameboyCircuitJson from "./assets/full-gameboy-current.unrouted.circuit.json" with {
  type: "json",
}

const fixtureUrl = new URL(
  "./assets/full-gameboy-current.unrouted.circuit.json",
  import.meta.url,
)

const isRoutingError = (element: AnyCircuitElement): boolean =>
  element.type === "pcb_autorouting_error" ||
  (element.type.endsWith("_error") &&
    (element.type.includes("trace") || element.type.includes("via")))

describe.skipIf(process.env.RUN_FULL_GBA_REPRO !== "1")(
  "full Game Boy Advance Pipeline 9 routing repro",
  () => {
    let routingErrors: AnyCircuitElement[] = []

    beforeAll(async () => {
      const fixtureBytes = readFileSync(fixtureUrl)
      expect(createHash("sha256").update(fixtureBytes).digest("hex")).toBe(
        "252286cef6bd5233b844c9de510d67a76b75394df46821e8a0eb4dcd32572321",
      )

      const unroutedCircuitJson = structuredClone(
        fullGameboyCircuitJson,
      ) as CircuitJson
      // Circuit JSON inflation does not have a simple_crystal inflator yet.
      // The chip inflator preserves X1's captured pads, ports, placement, and
      // internal pin connectivity, which are the only inputs used by routing.
      for (const element of unroutedCircuitJson) {
        if (
          element.type === "source_component" &&
          element.ftype === "simple_crystal"
        ) {
          Object.assign(element, { ftype: "simple_chip" })
        }
      }
      const importedBoard = unroutedCircuitJson.find(
        (element): element is PcbBoard => element.type === "pcb_board",
      )
      if (!importedBoard)
        throw new Error("GBA fixture is missing its PCB board")

      await expect(unroutedCircuitJson).toMatchPcbSnapshot(
        `${import.meta.path}-unrouted`,
      )

      const { circuit } = getTestFixture({
        platform: { schematicDisabled: true },
      })
      const autoroutingPhases = createAutoroutingPhaseIoStack(circuit)

      circuit.add(
        <board
          circuitJson={unroutedCircuitJson}
          autorouter="beta-pipeline9"
          autorouterEffortLevel="5x"
          layers={4}
          width={`${importedBoard.width}mm`}
          height={`${importedBoard.height}mm`}
          outline={importedBoard.outline}
          minTraceWidth="0.1mm"
          minTraceToPadEdgeClearance="0.1mm"
          minViaEdgeToPadEdgeClearance="0.1mm"
          minViaHoleEdgeToViaHoleEdgeClearance="0.2mm"
          minPlatedHoleDrillEdgeToDrillEdgeClearance="0.45mm"
          minPadEdgeToPadEdgeClearance="0.1mm"
          minBoardEdgeClearance="0.2mm"
          minViaHoleDiameter="0.2mm"
          minViaPadDiameter="0.45mm"
        />,
      )

      await circuit.renderUntilSettled()

      expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
      expect(autoroutingPhases).toHaveLength(1)
      expect(
        autoroutingPhases[0]?.startSimpleRouteJson.connections,
      ).toHaveLength(145)
      expect(autoroutingPhases[0]?.startSimpleRouteJson.obstacles).toHaveLength(
        411,
      )
      expect(autoroutingPhases[0]?.startSimpleRouteJson.layerCount).toBe(4)
      expect(autoroutingPhases[0]?.startSimpleRouteJson.traces ?? []).toEqual(
        [],
      )

      await expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-routed`)
      routingErrors = circuit.getCircuitJson().filter(isRoutingError)
    })

    test.failing(
      "the fully routed board should have no routing DRC errors",
      () => {
        expect(routingErrors).toEqual([])
      },
    )
  },
)
