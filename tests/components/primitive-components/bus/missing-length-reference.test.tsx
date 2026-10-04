import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

test("a missing length reference is an actionable source error before routing", () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board routingDisabled width={30} height={20}>
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="DATA" from=".U1 > .pin1" to=".U2 > .pin1" />
      <bus
        name="DATA_BUS"
        connections={["DATA"]}
        lengthMatchTo=".MISSING_PAIR"
        maxLengthSkew="0.5mm"
      />
    </board>,
  )
  expect(() => circuit.render()).toThrow(
    'Could not resolve routing reference ".MISSING_PAIR" in "DATA_BUS"',
  )
})
