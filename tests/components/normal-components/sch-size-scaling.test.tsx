import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "resistor schSize scales schematic component dimensions and port positions (#3106)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="30mm" height="30mm">
        <resistor name="R_XS" resistance="10k" schSize="xs" schX={0} schY={0} />
        <resistor name="R_MD" resistance="10k" schSize="md" schX={10} schY={0} />
      </board>,
    )

    circuit.render()

    const rXs = circuit.db.source_component.getWhere({ name: "R_XS" })!
    const rMd = circuit.db.source_component.getWhere({ name: "R_MD" })!

    const rXsSch = circuit.db.schematic_component.getWhere({
      source_component_id: rXs.source_component_id,
    })!
    const rMdSch = circuit.db.schematic_component.getWhere({
      source_component_id: rMd.source_component_id,
    })!

    expect(rXsSch.size.width).toBeLessThan(rMdSch.size.width)
    expect(rXsSch.size.height).toBeLessThan(rMdSch.size.height)
  },
  { timeout: 30000 },
)

test(
  "capacitor schSize scales schematic component dimensions (#3108)",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="30mm" height="30mm">
        <capacitor
          name="C_SM"
          capacitance="100nF"
          schSize="small"
          schX={0}
          schY={0}
        />
        <capacitor
          name="C_MD"
          capacitance="100nF"
          schSize="md"
          schX={10}
          schY={0}
        />
      </board>,
    )

    circuit.render()

    const cSm = circuit.db.source_component.getWhere({ name: "C_SM" })!
    const cMd = circuit.db.source_component.getWhere({ name: "C_MD" })!

    const cSmSch = circuit.db.schematic_component.getWhere({
      source_component_id: cSm.source_component_id,
    })!
    const cMdSch = circuit.db.schematic_component.getWhere({
      source_component_id: cMd.source_component_id,
    })!

    expect(cSmSch.size.width).toBeLessThan(cMdSch.size.width)
    expect(cSmSch.size.height).toBeLessThan(cMdSch.size.height)
  },
  { timeout: 30000 },
)
