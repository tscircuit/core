import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("device models respect pcbDisabled and model-less devices remain transparent", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <assembly.device modelUrl="/device.glb">
      <assembly.subassembly name="part" modelUrl="/part.glb" />
    </assembly.device>,
  )
  circuit.render()
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  const { circuit: empty } = getTestFixture()
  empty.add(<assembly.device name="empty" />)
  empty.render()
  expect(empty.getCircuitJson()).toHaveLength(0)
})
