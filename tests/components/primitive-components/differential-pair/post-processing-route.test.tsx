import { expect, test } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "post-processes a differential pair before final PCB output",
  async () => {
    const { circuit } = getTestFixture()
    const solverEvents: SolverStartedEvent[] = []
    circuit.on("solver:started", (event) => {
      if (event.solverName === "DifferentialPairPostProcessingSolver") {
        solverEvents.push(event)
      }
    })
    circuit.add(
      <board width="20mm" height="10mm">
        <differentialpair
          name="USB"
          positiveConnection="USB_P"
          negativeConnection="USB_N"
          maxLengthSkew={0.05}
        />
        <chip
          name="IN"
          pcbX={-6}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbY={-0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
            </footprint>
          }
        />
        <chip
          name="OUT"
          pcbX={6}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbY={-0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
            </footprint>
          }
        />
        <trace name="USB_P" from=".IN > .pin1" to=".OUT > .pin1" />
        <trace name="USB_N" from=".IN > .pin2" to=".OUT > .pin2" />
        <pcbnotetext
          pcbX={0}
          pcbY={3.5}
          fontSize={0.7}
          text="USB_P / USB_N: coupled after autorouting, max skew 0.05mm"
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
