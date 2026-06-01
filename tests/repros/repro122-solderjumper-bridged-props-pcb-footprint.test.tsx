import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getPcbBridgeTraceCount = async (solderJumper: any) => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {solderJumper}
    </board>,
  )

  await circuit.renderUntilSettled()

  return circuit.getCircuitJson().filter((elm: any) => elm.type === "pcb_trace")
    .length
}

test("solderjumper bridged props resolve bridged PCB footprints", async () => {
  const explicitTwoPinBridgeTraceCount = await getPcbBridgeTraceCount(
    <solderjumper name="SJ1" footprint="solderjumper2_bridged12" />,
  )
  const explicitThreePin23BridgeTraceCount = await getPcbBridgeTraceCount(
    <solderjumper name="SJ1" footprint="solderjumper3_bridged23" />,
  )
  const explicitThreePinAllBridgeTraceCount = await getPcbBridgeTraceCount(
    <solderjumper name="SJ1" footprint="solderjumper3_bridged123" />,
  )

  expect(
    await getPcbBridgeTraceCount(
      <solderjumper name="SJ1" footprint="solderjumper2" bridged />,
    ),
  ).toBe(explicitTwoPinBridgeTraceCount)
  expect(
    await getPcbBridgeTraceCount(
      <solderjumper
        name="SJ1"
        footprint="solderjumper2"
        bridgedPins={[["1", "2"]]}
      />,
    ),
  ).toBe(explicitTwoPinBridgeTraceCount)
  expect(
    await getPcbBridgeTraceCount(
      <solderjumper
        name="SJ1"
        footprint="solderjumper3"
        bridgedPins={[["2", "3"]]}
      />,
    ),
  ).toBe(explicitThreePin23BridgeTraceCount)
  expect(
    await getPcbBridgeTraceCount(
      <solderjumper name="SJ1" footprint="solderjumper3" bridged />,
    ),
  ).toBe(explicitThreePinAllBridgeTraceCount)

  expect(explicitTwoPinBridgeTraceCount).toBeGreaterThan(0)
  expect(explicitThreePin23BridgeTraceCount).toBeGreaterThan(0)
  expect(explicitThreePinAllBridgeTraceCount).toBeGreaterThan(0)
})
