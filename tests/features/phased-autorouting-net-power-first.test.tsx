import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("phased autorouting routes thick power net before signal traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm">
      <net name="GND" routingPhaseIndex={1} />
      <resistor name="P1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="P2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <resistor name="H1" resistance="1k" footprint="0402" pcbX={-5} pcbY={2} />
      <resistor name="H2" resistance="1k" footprint="0402" pcbX={5} pcbY={2} />
      <resistor
        name="V1A"
        resistance="1k"
        footprint="0402"
        pcbX={-2.5}
        pcbY={-4}
      />
      <resistor
        name="V1B"
        resistance="1k"
        footprint="0402"
        pcbX={-2.5}
        pcbY={4}
      />
      <resistor
        name="V2A"
        resistance="1k"
        footprint="0402"
        pcbX={2.5}
        pcbY={-4}
      />
      <resistor
        name="V2B"
        resistance="1k"
        footprint="0402"
        pcbX={2.5}
        pcbY={4}
      />
      <trace
        from=".P1 > .pin2"
        to=".P2 > .pin1"
        routingPhaseIndex={0}
        thickness={1}
      />
      <trace from=".H1 > .pin1" to="net.GND" />
      <trace from=".H2 > .pin1" to="net.GND" />
      <trace from=".V1A > .pin1" to=".V1B > .pin1" />
      <trace from=".V2A > .pin1" to=".V2B > .pin1" />
    </board>,
  )

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
