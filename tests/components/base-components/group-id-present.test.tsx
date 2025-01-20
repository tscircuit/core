import { it, expect } from "bun:test"
import { Circuit } from "lib/RootCircuit"

it("should correctly use selectAll and selectOne methods", () => {
  const project = new Circuit()

  project.add(
    <board width="10mm" height="10mm" minTraceWidth={0.2}>
      <group subcircuit name="G1">
        <resistor name="R1" resistance={100} footprint={"0402"} pcbX={1} pcbY={1} />
        <capacitor name="C1" capacitance={100} footprint={"0402"} pcbX={2} pcbY={2} />
        <trace from=".R1 .1" to=".C1 .2" />
      </group>
    </board>,
  )

  project.render()


  const sourceGroup = project.db.source_group.list()
  expect(sourceGroup.length).toBe(2)

  const pcbComponent = project.db.pcb_component.list()[0] // resistor
  expect(pcbComponent?.subcircuit_id).toBeDefined()

//   const pcbSmtPad = project.db.pcb_smtpad.list()[0]
//   expect(pcbSmtPad?.subcircuit_id).toBeDefined()
})
