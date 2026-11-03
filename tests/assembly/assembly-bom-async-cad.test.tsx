import { expect, test } from "bun:test"
import { AssemblyDevice } from "lib/components/primitive-components/AssemblyDevice"
import { AssemblyPart } from "lib/components/primitive-components/AssemblyPart"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

class DelayedAssemblyPart extends AssemblyPart {
  doInitialCadModelRender(): void {
    this._queueAsyncEffect("delayed-model", async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      super.doInitialCadModelRender()
    })
  }
}

test("BOM geometry references wait for async CAD generation", async () => {
  const { circuit } = getTestFixture()
  const device = new AssemblyDevice({ name: "device" })
  device.add(
    new DelayedAssemblyPart({
      name: "delayed",
      bomQuantity: 3,
      modelUrl: "https://models.example/part.glb",
    }),
  )
  circuit.add(device)
  await circuit.renderUntilSettled()
  const [bom] = circuit.db.cad_assembly_bom_item.list()
  expect(bom).toMatchObject({
    name: "delayed",
    quantity: 3,
    cad_component_ids: [circuit.db.cad_component.list()[0].cad_component_id],
  })
  expect(circuit.db.cad_component.list()).toHaveLength(1)
})
