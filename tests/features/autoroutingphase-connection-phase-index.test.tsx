import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoroutingphase connection props assign phase index order", async () => {
  const renderCircuitAndMatchPcbSnapshot = async (
    circuit: ReturnType<typeof getTestFixture>["circuit"],
    snapshotName: string,
  ) => {
    await circuit.renderUntilSettled()
    expect(circuit).toMatchPcbSnapshot(snapshotName)
  }

  const { circuit: horizontalFirstCircuit } = getTestFixture()

  horizontalFirstCircuit.add(
    <board width="12mm" height="12mm">
      <resistor name="H1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="H2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <resistor name="V1" resistance="1k" footprint="0402" pcbX={0} pcbY={-4} />
      <resistor name="V2" resistance="1k" footprint="0402" pcbX={0} pcbY={4} />
      <autoroutingphase phaseIndex={0} connection="H1.pin1" />
      <autoroutingphase phaseIndex={1} connection="V1.pin1" />
      <trace from=".H1 > .pin1" to=".H2 > .pin1" />
      <trace from=".V1 > .pin1" to=".V2 > .pin1" />
    </board>,
  )

  await renderCircuitAndMatchPcbSnapshot(
    horizontalFirstCircuit,
    `${import.meta.path}-horizontal-first`,
  )

  const { circuit: verticalFirstCircuit } = getTestFixture()

  verticalFirstCircuit.add(
    <board width="12mm" height="12mm">
      <resistor name="H1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="H2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <resistor name="V1" resistance="1k" footprint="0402" pcbX={0} pcbY={-4} />
      <resistor name="V2" resistance="1k" footprint="0402" pcbX={0} pcbY={4} />
      <autoroutingphase phaseIndex={1} connection="H1.pin1" />
      <autoroutingphase phaseIndex={0} connection="V1.pin1" />
      <trace from=".H1 > .pin1" to=".H2 > .pin1" />
      <trace from=".V1 > .pin1" to=".V2 > .pin1" />
    </board>,
  )

  await renderCircuitAndMatchPcbSnapshot(
    verticalFirstCircuit,
    `${import.meta.path}-vertical-first`,
  )

  const { circuit: arraysHorizontalFirstCircuit } = getTestFixture()

  arraysHorizontalFirstCircuit.add(
    <board width="18mm" height="18mm">
      <resistor
        name="H1"
        resistance="1k"
        footprint="0402"
        pcbX={-7}
        pcbY={-1}
      />
      <resistor name="H2" resistance="1k" footprint="0402" pcbX={7} pcbY={-1} />
      <resistor name="H3" resistance="1k" footprint="0402" pcbX={-7} pcbY={1} />
      <resistor name="H4" resistance="1k" footprint="0402" pcbX={7} pcbY={1} />
      <resistor
        name="V1"
        resistance="1k"
        footprint="0402"
        pcbX={-1}
        pcbY={-7}
      />
      <resistor name="V2" resistance="1k" footprint="0402" pcbX={-1} pcbY={7} />
      <resistor name="V3" resistance="1k" footprint="0402" pcbX={1} pcbY={-7} />
      <resistor name="V4" resistance="1k" footprint="0402" pcbX={1} pcbY={7} />
      <autoroutingphase phaseIndex={0} connections={["H1.pin1", "H3.pin1"]} />
      <autoroutingphase phaseIndex={1} connections={["V1.pin1", "V3.pin1"]} />
      <trace from=".H1 > .pin1" to=".H2 > .pin1" />
      <trace from=".H3 > .pin1" to=".H4 > .pin1" />
      <trace from=".V1 > .pin1" to=".V2 > .pin1" />
      <trace from=".V3 > .pin1" to=".V4 > .pin1" />
    </board>,
  )

  await renderCircuitAndMatchPcbSnapshot(
    arraysHorizontalFirstCircuit,
    `${import.meta.path}-arrays-horizontal-first`,
  )

  const { circuit: arraysVerticalFirstCircuit } = getTestFixture()

  arraysVerticalFirstCircuit.add(
    <board width="18mm" height="18mm">
      <resistor
        name="H1"
        resistance="1k"
        footprint="0402"
        pcbX={-7}
        pcbY={-1}
      />
      <resistor name="H2" resistance="1k" footprint="0402" pcbX={7} pcbY={-1} />
      <resistor name="H3" resistance="1k" footprint="0402" pcbX={-7} pcbY={1} />
      <resistor name="H4" resistance="1k" footprint="0402" pcbX={7} pcbY={1} />
      <resistor
        name="V1"
        resistance="1k"
        footprint="0402"
        pcbX={-1}
        pcbY={-7}
      />
      <resistor name="V2" resistance="1k" footprint="0402" pcbX={-1} pcbY={7} />
      <resistor name="V3" resistance="1k" footprint="0402" pcbX={1} pcbY={-7} />
      <resistor name="V4" resistance="1k" footprint="0402" pcbX={1} pcbY={7} />
      <autoroutingphase phaseIndex={1} connections={["H1.pin1", "H3.pin1"]} />
      <autoroutingphase phaseIndex={0} connections={["V1.pin1", "V3.pin1"]} />
      <trace from=".H1 > .pin1" to=".H2 > .pin1" />
      <trace from=".H3 > .pin1" to=".H4 > .pin1" />
      <trace from=".V1 > .pin1" to=".V2 > .pin1" />
      <trace from=".V3 > .pin1" to=".V4 > .pin1" />
    </board>,
  )

  await renderCircuitAndMatchPcbSnapshot(
    arraysVerticalFirstCircuit,
    `${import.meta.path}-arrays-vertical-first`,
  )
})
