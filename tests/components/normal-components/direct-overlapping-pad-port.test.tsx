import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("overlapping direct pad children retain a single PCB port", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="8mm" routingDisabled>
      <chip name="U1" pinLabels={{ pin1: "SIG" }}>
        <smtpad shape="rect" width={2} height={2} portHints={["pin1"]} />
        <platedhole
          shape="circle"
          holeDiameter={0.6}
          outerDiameter={1.2}
          portHints={["pin1"]}
        />
      </chip>
      <pcbnotetext
        pcbY={2.5}
        text="Overlapping copper shares one port"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pcbPorts = circuit.db.pcb_port.list()
  expect(pcbPorts).toHaveLength(1)
  expect(circuit.db.pcb_smtpad.list()[0].pcb_port_id).toBe(
    pcbPorts[0].pcb_port_id,
  )
  expect(circuit.db.pcb_plated_hole.list()[0].pcb_port_id).toBe(
    pcbPorts[0].pcb_port_id,
  )
  expect(circuit.db.source_component_internal_connection.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
