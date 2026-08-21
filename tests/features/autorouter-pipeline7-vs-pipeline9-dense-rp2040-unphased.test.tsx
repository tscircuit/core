import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { AutorouterVersion } from "lib/utils/autorouting/autorouter-version"
import { stackSvgsHorizontally } from "stack-svgs"
import "tests/fixtures/extend-expect-any-svg"
import {
  DENSE_RP2040_PHASE_COUNT,
  createDenseRp2040UnphasedCircuit,
} from "./autorouter-dense-rp2040-phases.fixture"

const renderUnphasedCircuit = async (autorouterVersion: AutorouterVersion) => {
  const result = createDenseRp2040UnphasedCircuit(autorouterVersion)
  const start = performance.now()
  await result.circuit.renderUntilSettled()

  return {
    ...result,
    durationMs: performance.now() - start,
  }
}

const parityTest = test.skipIf(
  process.env.TEST_PIPELINE7_PIPELINE9_PARITY === undefined,
)

parityTest(
  "pipeline7 and pipeline9 route the dense RP2040 side by side without phases",
  async () => {
    const pipeline7 = await renderUnphasedCircuit("beta_pipeline7")
    const pipeline9 = await renderUnphasedCircuit("beta_pipeline9")

    console.table({
      pipeline7Unphased: {
        durationMs: pipeline7.durationMs.toFixed(2),
        traces: pipeline7.circuit.db.pcb_trace.list().length,
        vias: pipeline7.circuit.db.pcb_via.list().length,
        autoroutingErrors:
          pipeline7.circuit.db.pcb_autorouting_error.list().length,
        traceErrors: pipeline7.circuit.db.pcb_trace_error.list().length,
      },
      pipeline9Unphased: {
        durationMs: pipeline9.durationMs.toFixed(2),
        traces: pipeline9.circuit.db.pcb_trace.list().length,
        vias: pipeline9.circuit.db.pcb_via.list().length,
        autoroutingErrors:
          pipeline9.circuit.db.pcb_autorouting_error.list().length,
        traceErrors: pipeline9.circuit.db.pcb_trace_error.list().length,
      },
    })

    expect(pipeline7.autoroutingSolverNames).toEqual([
      "AutoroutingPipelineSolver7_MultiGraph",
    ])
    expect(pipeline9.autoroutingSolverNames).toEqual([
      "AutoroutingPipelineSolver9_PreloadedTraceGraph",
    ])
    expect(pipeline7.autoroutingPhaseIoStack).toHaveLength(1)
    expect(pipeline9.autoroutingPhaseIoStack).toHaveLength(1)
    expect(
      pipeline7.autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.connections,
    ).toHaveLength(DENSE_RP2040_PHASE_COUNT)
    expect(
      pipeline9.autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.connections,
    ).toHaveLength(DENSE_RP2040_PHASE_COUNT)
    expect(pipeline7.circuit.db.pcb_trace.list()).toHaveLength(
      DENSE_RP2040_PHASE_COUNT,
    )
    expect(pipeline9.circuit.db.pcb_trace.list()).toHaveLength(
      DENSE_RP2040_PHASE_COUNT,
    )
    expect(pipeline7.circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(pipeline9.circuit.db.pcb_autorouting_error.list()).toEqual([])

    const comparisonSvg = stackSvgsHorizontally(
      [
        convertCircuitJsonToPcbSvg(pipeline7.circuit.getCircuitJson()),
        convertCircuitJsonToPcbSvg(pipeline9.circuit.getCircuitJson()),
      ],
      {
        gap: 24,
        normalizeSize: false,
        rootAttributes: {
          "data-testid": "pipeline7-vs-pipeline9-dense-rp2040-unphased",
        },
      },
    )

    expect(comparisonSvg).toMatchSvgSnapshot(
      import.meta.path,
      "autorouter-pipeline7-vs-pipeline9-dense-rp2040-unphased",
    )
  },
  180_000,
)
