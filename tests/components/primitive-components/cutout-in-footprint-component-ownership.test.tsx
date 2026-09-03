import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cutout in footprint records its pcb component owner", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <cutout
              shape="circle"
              radius="1mm"
              pcbX="2mm"
              pcbY="0mm"
            />
            <smtpad
              portHints={["1"]}
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX="0mm"
              pcbY="0mm"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pcbComponent = circuit.db.pcb_component.list()[0]
  const pcbCutout = circuit.db.pcb_cutout.list()[0]

  expect(pcbComponent).toBeDefined()
  expect(pcbCutout).toBeDefined()
  expect(pcbCutout?.pcb_component_id).toBe(pcbComponent?.pcb_component_id)
})
