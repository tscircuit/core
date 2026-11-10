import { expect, test } from "bun:test"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { expectDifferentialPairLengths } from "tests/fixtures/expect-differential-pair-lengths"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routes an ordered J1-ESD-MCU pair and excludes test-point copper from the lane sums", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} schematicDisabled autorouter="auto_local">
      <chip name="J1" pcbX={-7} footprint={differentialPairPathPads()} />
      <chip name="ESD" footprint={differentialPairPathPads()} />
      <chip name="MCU" pcbX={7} footprint={differentialPairPathPads()} />
      <testpoint name="TP" pcbY={4} footprintVariant="pad" />
      <trace name="DP1" from=".J1 > .pin1" to=".ESD > .pin1" />
      <trace name="DP2" from=".ESD > .pin1" to=".MCU > .pin1" />
      <trace name="DM1" from=".J1 > .pin2" to=".ESD > .pin2" />
      <trace name="DM2" from=".ESD > .pin2" to=".MCU > .pin2" />
      <trace name="TAP" from=".ESD > .pin1" to=".TP > .pin1" />
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP2"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
      <pcbnotetext pcbX={-7} pcbY={-1.5} text="J1" fontSize={0.5} />
      <pcbnotetext pcbY={-1.5} text="ESD" fontSize={0.5} />
      <pcbnotetext pcbX={7} pcbY={-1.5} text="MCU" fontSize={0.5} />
      <pcbnotetext
        pcbY={-3}
        text="J1 -> ESD -> MCU: lane skew <= 0.1mm; TP tap excluded"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expectDifferentialPairLengths(circuit)
  const tap = circuit.db.source_trace.getWhere({ name: "TAP" })!
  expect(circuit.db.pcb_trace.list()).toHaveLength(5)
  expect(
    circuit.db.source_bus.getWhere({ name: "USB" })!.source_trace_ids,
  ).not.toContain(tap.source_trace_id)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
