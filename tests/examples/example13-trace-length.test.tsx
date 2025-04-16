import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { su } from "@tscircuit/circuit-json-util"

test("schematic net symbol", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="22mm">
      <resistor name="R1" resistance="10k" footprint="0402" schX={3} schY={0} />
      <capacitor
        name="C1"
        pcbX={5}
        pcbY={3}
        schX={-2}
        schY={3}
        capacitance="10k"
        footprint="0402"
        schRotation={90}
        maxDecouplingTraceLength={10}
      />
      <trace schDisplayLabel="GND3" from=".R1 > .pin1" to=".C1 > .pin2" />
      <trace maxLength={12} from=".R1 > .pin2" to="net.GND" />
      <trace from=".C1 > .pin2" to="net.GND" />
    </board>,
  )

  const sourceTrace = circuit
    .getCircuitJson()
    .filter((c) => c.type === "source_trace")
  expect(sourceTrace[0].max_length).toBe(10)
  expect(sourceTrace[0].display_name).toBe(".R1 > .pin1 to .C1 > .pin2")
  expect(sourceTrace[1].max_length).toBe(12)
  expect(sourceTrace[1].display_name).toBe(".R1 > .pin2 to net.GND")
  //connected to C1 inherits maxDecouplingTraceLength
  expect(sourceTrace[2].max_length).toBe(10)
  expect(sourceTrace[2].display_name).toBe(".C1 > .pin2 to net.GND")
})
