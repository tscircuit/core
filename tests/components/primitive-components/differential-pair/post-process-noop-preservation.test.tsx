import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("no-op differential pair post-processing preserves routed traces", async () => {
  const { circuit } = getTestFixture()
  let pcbTracesBeforePostProcess: PcbTrace[] | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "DifferentialPairSolver") {
      pcbTracesBeforePostProcess = structuredClone(circuit.db.pcb_trace.list())
    }
  })

  circuit.add(
    <board width="32mm" height="18mm" autorouter="sequential-trace">
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <testpoint name="USB_P_LEFT" footprintVariant="pad" pcbX={-12} pcbY={2} />
      <testpoint name="USB_P_RIGHT" footprintVariant="pad" pcbX={12} pcbY={2} />
      <testpoint
        name="USB_N_LEFT"
        footprintVariant="pad"
        pcbX={-12}
        pcbY={-2}
      />
      <testpoint
        name="USB_N_RIGHT"
        footprintVariant="pad"
        pcbX={12}
        pcbY={-2}
      />
      <trace
        name="USB_P"
        from=".USB_P_LEFT > .pin1"
        to=".USB_P_RIGHT > .pin1"
        pcbStraightLine
      />
      <trace
        name="USB_N"
        from=".USB_N_LEFT > .pin1"
        to=".USB_N_RIGHT > .pin1"
        pcbStraightLine
      />
      <pcbnotetext
        pcbX={0}
        pcbY={6}
        fontSize={0.75}
        text="Differential-pair post-process: USB_P / USB_N | max skew 0.05mm | expected no-op preservation"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(pcbTracesBeforePostProcess).toBeDefined()
  expect(circuit.db.pcb_trace.list()).toEqual(pcbTracesBeforePostProcess!)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
