import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import type { SolverStartedEvent } from "lib/events"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// The new escape-via obstacles omit bottom, although blind vias are disabled.
// Core gives the generated vias their full physical span and detects the short.
test.failing(
  "global routing must avoid the physical span of new plane escape vias",
  async () => {
    const { circuit } = getTestFixture()
    const phases = createAutoroutingPhaseIoStack(circuit)
    const solverNames: SolverStartedEvent["solverName"][] = []
    circuit.on("solver:started", ({ solverName }) =>
      solverNames.push(solverName),
    )

    circuit.add(
      <board
        width="16mm"
        height="12mm"
        layers={4}
        autorouter="beta_pipeline9"
        minTraceWidth="0.15mm"
        defaultTraceWidth="0.15mm"
        minTraceToPadEdgeClearance="0.1mm"
        minViaPadDiameter="0.6mm"
        minViaHoleDiameter="0.3mm"
      >
        <group name="POWER" pcbWidth="9mm" pcbHeight="8mm">
          <copperpour layer="inner2" connectsTo="net.VCC" unbroken />
          <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
          <trace from="U1.pin2" to="net.VCC" />
          <trace from="U1.pin3" to="net.VCC" />
        </group>

        <resistor
          name="R_LEFT"
          resistance="1k"
          footprint="0402"
          layer="bottom"
          pcbX={-6}
          pcbY={0.635}
        />
        <resistor
          name="R_RIGHT"
          resistance="1k"
          footprint="0402"
          layer="bottom"
          pcbX={6}
          pcbY={0.635}
        />
        <trace name="BOTTOM_SIGNAL" from="R_LEFT.pin1" to="R_RIGHT.pin2" />

        <pcbnotetext
          pcbY={5}
          fontSize="0.45mm"
          text="TOP TO INNER2 ESCAPE; PHYSICAL VIA IS THROUGH"
        />
        <pcbnotetext
          pcbY={-5}
          fontSize="0.45mm"
          text="BOTTOM SIGNAL MUST AVOID EVERY THROUGH VIA"
        />
      </board>,
    )

    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()
    const routingErrors = await runAllRoutingChecks(circuitJson)

    expect(phases).toHaveLength(1)
    expect(phases[0]!.startSimpleRouteJson).toMatchObject({
      layerCount: 4,
      allowBlindAndBuriedVias: false,
    })
    expect(solverNames).toContain(
      "AutoroutingPipelineSolver9_PreloadedTraceGraph",
    )
    const planeVias = circuit.db.pcb_via
      .list()
      .filter((via) => via.from_layer === "top" && via.to_layer === "inner2")
    expect(planeVias.length).toBeGreaterThan(0)
    for (const via of planeVias) {
      expect(via.layers).toEqual(["top", "inner1", "inner2", "bottom"])
    }
    const bottomSignal = circuit.db.source_trace.getWhere({
      name: "BOTTOM_SIGNAL",
    })!
    expect(
      circuit.db.pcb_trace
        .list()
        .some(
          (trace) => trace.source_trace_id === bottomSignal.source_trace_id,
        ),
    ).toBeTrue()

    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      layer: "bottom",
      showSolderMask: false,
      shouldDrawErrors: false,
      showErrorsInTextOverlay: true,
    })
    await expect(phases).toMatchAutoroutingPhaseIoStackSnapshot(
      import.meta.path,
      "new-through-via-physical-span-phases",
      circuit,
    )
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(routingErrors).toEqual([])
  },
  30_000,
)
