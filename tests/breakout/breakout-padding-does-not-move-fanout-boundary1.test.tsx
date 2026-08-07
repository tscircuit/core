import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const qfnFootprint =
  "qfn56_w7.8_h7.8_p0.4mm_pw0.23mm_pl0.8mm_thermalpad3.2x3.2" as const

const getPropertyIgnoredWarnings = (circuit: any) =>
  circuit
    .getCircuitJson()
    .filter(
      (element: any) => element.type === "source_property_ignored_warning",
    ) as Array<{ property_name: string; message: string }>

const addBoard = (circuit: any, breakoutProps: Record<string, string>) => {
  circuit.add(
    <board width="30mm" height="30mm" layers={4}>
      <breakout name="ESCAPE" {...breakoutProps}>
        <chip name="U1" footprint={qfnFootprint} pcbX={0} pcbY={0} />
      </breakout>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={10} pcbY={0} />
      <trace name="T1" from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )
}

test("padding alone on a breakout warns that it does not move the fanout boundary", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })
  addBoard(circuit, { padding: "1.2mm" })
  await circuit.renderUntilSettled()

  const warnings = getPropertyIgnoredWarnings(circuit)
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.property_name).toBe("padding")
  expect(warnings[0]!.message).toContain("ESCAPE")
  expect(warnings[0]!.message).toContain("fanoutBoundaryPadding")
}, 60_000)
