import { expect, test } from "bun:test"
import { assembly, enclosure } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Before the durable assembly record lands, assembly.device is a transparent
 * assembly-device container: it may contain the board and enclosure without
 * becoming an
 * electrical group or changing the existing Circuit JSON representation.
 */
test("assembly.device wraps the staged board and enclosure", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="controller">
      <board name="B1" width="30mm" height="20mm" routingDisabled />
      <enclosure.fdm.box boardRef=".B1" />
    </assembly.device>,
  )

  circuit.render()

  expect(circuit.db.pcb_board.list()).toHaveLength(1)
  expect(
    circuit.db.cad_component.list().filter((cad) => cad.model_jscad),
  ).toHaveLength(2)
})
