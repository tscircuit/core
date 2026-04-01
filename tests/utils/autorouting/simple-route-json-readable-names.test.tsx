import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import { getReadableName } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("verify ID mapping fix", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" pcbX={-2} pcbY={0} resistance="1k" footprint="0402" />
      <resistor name="R2" pcbX={2} pcbY={0} resistance="1k" footprint="0402" />
      <net name="MY_NET" />
      <trace from=".R1 > .pin1" to="net.MY_NET" />
      <trace from=".R2 > .pin1" to="net.MY_NET" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify that getReadableName resolves correctly
  const pcb_port = circuit.db.pcb_port.list()[0]

  const readableName = getReadableName(circuit.db, pcb_port?.pcb_port_id)
  console.log("Resolved Readable Name:", readableName)

  expect(typeof readableName).toBe("string")
  expect(readableName).toContain(".")
})
