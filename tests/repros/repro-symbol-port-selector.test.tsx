import { expect, test } from "bun:test"
import { RootCircuit, type Port } from "lib"

const regression = process.env.ASSERT_PORT_SELECTOR_CONTRACT
  ? test
  : test.failing

regression(
  "a symbol port's generated selector resolves only the original port",
  async () => {
    const circuit = new RootCircuit()
    circuit.add(
      <board
        width={10}
        height={10}
        routingDisabled
        pcbDisabled
        schematicDisabled
      >
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
    const [port] = circuit.selectAll<Port>("port")
    expect(port!.parent!.componentName).toBe("Symbol")
    expect(
      circuit.selectOne("Q_PD_INHIBIT.pin2", { type: "port" }) === port,
    ).toBe(true)
    expect(
      circuit.selectOne(port!.getPortSelector(), { type: "port" }) === port,
    ).toBe(true)
    expect(circuit.selectAll(port!.getPortSelector())).toEqual([port!])
  },
)
