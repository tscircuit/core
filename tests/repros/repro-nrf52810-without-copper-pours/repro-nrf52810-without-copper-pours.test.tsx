import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Nrf52810Circuit from "./nrf52810-circuit"

// Reproduces https://tscircuit.com/seveibar/nrf52810#files without copper pours.
test(
  "nRF52810 tracker rejects an undersized autorouter result",
  async () => {
    const { circuit } = getTestFixture({
      platform: { placementDrcChecksDisabled: true },
    })
    let autoroutingEndCount = 0
    circuit.on("autorouting:end", () => {
      autoroutingEndCount++
    })

    circuit.add(<Nrf52810Circuit />)
    await circuit.renderUntilSettled()

    const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
    expect(autoroutingErrors).toHaveLength(1)
    expect(autoroutingErrors[0]?.message).toContain(
      'Autorouter output trace "source_trace_58_0" has maximum width 0.15mm, below min_trace_thickness 0.18mm',
    )
    expect(autoroutingEndCount).toBe(0)

    const rejectedSourceTraceId = autoroutingErrors[0]?.message.match(
      /required by source trace (source_trace_\d+)/,
    )?.[1]
    expect(rejectedSourceTraceId).toBeDefined()
    expect(
      circuit.db.source_trace.get(rejectedSourceTraceId!)?.min_trace_thickness,
    ).toBe(0.18)
    expect(
      circuit.db.pcb_trace
        .list()
        .filter((trace) => trace.source_trace_id === rejectedSourceTraceId),
    ).toEqual([])
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 30_000 },
)
