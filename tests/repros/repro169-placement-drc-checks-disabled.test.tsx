import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/*
 * Bug: placementDrcChecksDisabled prop has no effect
 *
 * What should happen:
 *   Setting <board placementDrcChecksDisabled> should bypass placement DRC
 *   checks so that autorouting still runs even with overlapping components.
 *
 * What actually happens:
 *   The autorouter emits pcb_autorouting_error and skips routing:
 *   "Autorouting was skipped because N PCB placement errors were found.
 *    Fix the placement errors or set placementDrcChecksDisabled to true
 *    to route anyway."
 *
 * The prop IS set on the board but has no effect because:
 *   1. board.ts Zod schema in @tscircuit/props doesn't accept it
 *   2. Zod silently drops it during validation
 *   3. getInheritedProperty("placementDrcChecksDisabled") can't find it
 *      in _parsedProps
 *   4. The DRC check runs anyway, finds N errors, and blocks autorouting
 *
 * Visual: the PCB snapshot shows two overlapping qfn32 chips with no
 * traces routed between them — the trace from U1.pin1 to U2.pin2 is
 * missing because autorouting was skipped entirely.
 */
test.failing(
  "placementDrcChecksDisabled prop should bypass autorouting block",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      // @ts-expect-error — placementDrcChecksDisabled IS a valid prop per the
      // error message, but the board Zod schema (@tscircuit/props) doesn't
      // include it, so it's silently dropped. This IS the bug.
      <board width="10mm" height="10mm" placementDrcChecksDisabled>
        <chip name="U1" footprint="qfn32" pcbX={0} pcbY={0} />
        <chip name="U2" footprint="qfn32" pcbX={0} pcbY={0} />
        <trace from=".U1 > .pin1" to=".U2 > .pin2" />
      </board>,
    )

    await circuit.renderUntilSettled()

    // PCB snapshot: should show two chips with a trace connecting them
    // Currently shows: two chips, no trace (autorouting skipped)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const json = circuit.getCircuitJson()

    const autoroutingErrors = json.filter(
      (e: any) => e.type === "pcb_autorouting_error",
    )
    const traceErrors = json.filter(
      (e: any) => e.type === "pcb_trace_missing_error",
    )

    // Log the actual error message the user sees
    for (const err of autoroutingErrors) {
      console.log(`AUTOROUTER: ${(err as any).message}`)
    }

    // Both should be 0 if the prop worked — autorouting should run
    // despite the placement DRC errors from overlapping chips
    expect(autoroutingErrors.length).toBe(0)
    expect(traceErrors.length).toBe(0)
  },
)
