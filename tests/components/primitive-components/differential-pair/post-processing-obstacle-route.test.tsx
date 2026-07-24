import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "post-processes a differential pair around a centered keepout obstacle",
  async () => {
    const { circuit } = getTestFixture()
    const solverEvents: SolverStartedEvent[] = []
    circuit.on("solver:started", (event) => {
      if (event.solverName === "DifferentialPairPostProcessingSolver") {
        solverEvents.push(event)
      }
    })
    circuit.add(
      <board width="20mm" height="10mm" autorouter="sequential-trace">
        <differentialpair
          name="USB"
          positiveConnection="USB_P"
          negativeConnection="USB_N"
          maxLengthSkew={0.05}
        />
        <testpoint
          name="USB_P_LEFT"
          pcbX={-6}
          pcbY={-0.15}
          padDiameter={0.1}
          footprintVariant="pad"
        />
        <testpoint
          name="USB_P_RIGHT"
          pcbX={6}
          pcbY={-0.15}
          padDiameter={0.1}
          footprintVariant="pad"
        />
        <testpoint
          name="USB_N_LEFT"
          pcbX={-6}
          pcbY={0.15}
          padDiameter={0.1}
          footprintVariant="pad"
        />
        <testpoint
          name="USB_N_RIGHT"
          pcbX={6}
          pcbY={0.15}
          padDiameter={0.1}
          footprintVariant="pad"
        />
        <keepout shape="rect" width="2mm" height="2mm" pcbX={0} pcbY={0} />
        <trace
          name="USB_P"
          from=".USB_P_LEFT > .pin1"
          to=".USB_P_RIGHT > .pin1"
        />
        <trace
          name="USB_N"
          from=".USB_N_LEFT > .pin1"
          to=".USB_N_RIGHT > .pin1"
        />
        <pcbnotetext
          pcbX={0}
          pcbY={3.5}
          fontSize={0.65}
          text="USB pair: 0.30mm centerline spacing around centered 2mm obstacle"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(solverEvents).toHaveLength(1)
    const postProcessingWarnings = circuit.db.pcb_trace_warning
      .list()
      .filter((warning) => warning.message.includes("Differential pair"))
    expect(postProcessingWarnings).toHaveLength(0)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 15_000 },
)
