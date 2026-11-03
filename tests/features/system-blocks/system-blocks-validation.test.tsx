import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { ReactElement } from "react"

test("rejects invalid system graph names, hierarchy, endpoints, and PCB references", () => {
  const fails = (element: ReactElement, message: string) => {
    const { circuit } = getTestFixture()
    expect(() => {
      circuit.add(element)
      circuit.render()
    }).toThrow(message)
    expect(circuit.db.system_block_page.list()).toHaveLength(0)
  }
  fails(<systemblock.component name="orphan" />, "must be inside")
  fails(
    <systemblock.page name="p">
      <resistor name="R1" resistance="1k" />
    </systemblock.page>,
    "can contain only",
  )
  fails(
    <systemblock.page name="p">
      <systemblock.page name="nested" />
    </systemblock.page>,
    "can contain only",
  )
  fails(
    <systemblock.page name="p">
      <systemblock.component name="duplicate" />
      <systemblock.group name="g">
        <systemblock.component name="duplicate" />
      </systemblock.group>
    </systemblock.page>,
    'Duplicate system block name "duplicate"',
  )
  fails(
    <systemblock.page name="p">
      <systemblock.component name="a" />
      <systemblock.connection from="a" to="missing" />
    </systemblock.page>,
    'endpoint "missing"',
  )
  fails(
    <systemblock.page name="p">
      <systemblock.group name="g" />
      <systemblock.component name="a" />
      <systemblock.connection from="a" to="g" />
    </systemblock.page>,
    'endpoint "g"',
  )
  fails(
    <systemblock.page name="p">
      <systemblock.component name="a" />
      <systemblock.connection name="link" from="a" to="a" />
      <systemblock.connection name="link" from="a" to="a" />
    </systemblock.page>,
    'Duplicate system connection name "link"',
  )
  fails(
    <systemblock.page name="p">
      <systemblock.component name="block" pcbComponentName="missing" />
    </systemblock.page>,
    'PCB component named "missing"',
  )
  fails(
    <systemblock.page name="p">
      <systemblock.group name="g" pcbSubcircuitName="missing" />
    </systemblock.page>,
    'PCB subcircuit named "missing"',
  )
  const { circuit } = getTestFixture()
  circuit.add(<systemblock.page name="same" />)
  circuit.add(<systemblock.page name="same" />)
  expect(() => circuit.render()).toThrow('Duplicate system page name "same"')
})
