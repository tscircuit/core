import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("shared labels cannot silently select or internally connect distinct physical balls", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} routingDisabled>
      <chip
        name="U1"
        pinLabels={{ A1: "GND", A2: "GND" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["A1"]}
              shape="circle"
              radius={0.2}
              pcbX={-0.4}
            />
            <smtpad portHints={["A2"]} shape="circle" radius={0.2} pcbX={0.4} />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const ports = circuit.db.source_port.list()
  expect(ports).toHaveLength(2)
  expect(circuit.db.source_component_internal_connection.list()).toHaveLength(0)
  expect(() => circuit.selectOne(".U1 > .GND", { type: "port" })).toThrow(
    'Ambiguous port ".U1 > .GND"; use a physical ball name: U1.A1, U1.A2.',
  )
  expect(circuit.selectOne(".U1 > .A1", { type: "port" })).not.toBe(
    circuit.selectOne(".U1 > .A2", { type: "port" }),
  )
})
