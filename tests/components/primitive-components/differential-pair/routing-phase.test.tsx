import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routes both differential pair traces in the same routing phase", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <trace
        name="USB_P"
        from=".U1 > .pin1"
        to=".U2 > .pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="USB_N"
        from=".U1 > .pin2"
        to=".U2 > .pin6"
        routingPhaseIndex={0}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4}
        fontSize={0.8}
        text="USB differential pair: routing phase 0"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    autoroutingPhaseIoStack[0]?.startSimpleRouteJson?.differentialPairs,
  ).toHaveLength(1)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "differential-pair-routing-phase",
    circuit,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
