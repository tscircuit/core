import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "solderjumper without an explicit footprint should render two PCB ports",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="18mm" height="8mm">
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
        <solderjumper name="JP1" pinCount={2} bridged={false} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />

        <trace from=".R1 > .pin2" to=".JP1 > .pin1" />
        <trace from=".JP1 > .pin2" to=".R2 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const jumperSourceComponent = circuit.db.source_component.getWhere({
      name: "JP1",
    })
    const jumperPcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: jumperSourceComponent!.source_component_id,
    })
    const jumperPcbPorts = circuit.db.pcb_port.list({
      pcb_component_id: jumperPcbComponent!.pcb_component_id,
    })

    expect(jumperPcbPorts).toHaveLength(2)
  },
)
