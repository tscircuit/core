import { expect, test } from "bun:test"
import { RootCircuit, type Group, type Port } from "lib"

test.failing("symbol port selector round-trip", async () => {
  const circuit = new RootCircuit({ platform: { pcbDisabled: true } })
  circuit.add(
    <board routingDisabled schematicDisabled>
      <chip
        name="Q_PD_INHIBIT"
        symbol={
          <symbol>
            <port name="pin2" pinNumber={2} />
          </symbol>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [port] = (circuit.firstChild as Group).selectAll<Port>("port")
  const selector = port!.getPortSelector()
  expect(circuit.selectAll(selector)).toEqual([port!])
  expect(circuit.selectOne(selector, { type: "port" }) === port).toBe(true)
})
