import { expect, test } from "bun:test"
import {
  SystemBlockPage,
  SystemBlockComponent,
  SystemBlockConnection,
} from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("system page updates replace geometry and clean up removed records", async () => {
  const { circuit } = getTestFixture()
  const page = new SystemBlockPage({ name: "updates" })
  const sensor = new SystemBlockComponent({
    name: "sensor",
    displayName: "Sensor",
  })
  const controller = new SystemBlockComponent({
    name: "controller",
    displayName: "Controller",
  })
  page.add(sensor)
  page.add(controller)
  page.add(
    new SystemBlockConnection({
      from: "sensor",
      to: "controller",
      label: "Samples",
    }),
  )
  circuit.add(page)
  circuit.render()
  await expect(
    convertCircuitJsonToSystemSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path, "system-blocks-before-update")
  page.setProps({ direction: "down" })
  controller.setProps({
    displayName: "Updated controller",
    description: "Processes measurements",
  })
  const spare = new SystemBlockComponent({ name: "spare" })
  page.add(spare)
  circuit.render()
  page.remove(spare)
  circuit.render()
  expect(circuit.db.system_block_page.list()).toHaveLength(1)
  expect(circuit.db.system_block_component.list()).toHaveLength(2)
  expect(circuit.db.system_block_connection.list()).toHaveLength(1)
  await expect(
    convertCircuitJsonToSystemSvg(circuit.getCircuitJson(), { width: 500 }),
  ).toMatchSvgSnapshot(import.meta.path, "system-blocks-after-update")
  page.shouldBeRemoved = true
  circuit.render()
  expect(
    circuit
      .getCircuitJson()
      .filter((record) => record.type.startsWith("system_block_")),
  ).toHaveLength(0)
})
