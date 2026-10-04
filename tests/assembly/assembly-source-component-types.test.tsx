import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly sources use their own ftypes and retain CAD ownership", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="DEVICE" modelUrl="https://example.com/device.glb">
      <assembly.motor name="MOTOR" standard="nema17" />
      <assembly.printedpart
        name="SPACER"
        jscad={<jscad.cuboid size={[10, 10, 4]} />}
      />
      <assembly.subassembly
        name="MODULE"
        cadModel={{ stlUrl: "/module.stl" }}
      />
      <assembly.cadassembly name="ALIAS" cadModel={{ stlUrl: "/alias.stl" }} />
      <assembly.screen name="SCREEN" connectsTo=".U1" width={20} height={10} />
      <board width={30} height={30} routingDisabled>
        <chip name="U1" footprint="soic8" />
      </board>
    </assembly.device>,
  )
  circuit.render()

  const expectedTypes = {
    DEVICE: "subassembly",
    MOTOR: "motor",
    SPACER: "printedpart",
    MODULE: "subassembly",
    ALIAS: "subassembly",
    SCREEN: "subassembly",
    U1: "simple_chip",
  } as const
  for (const [name, ftype] of Object.entries(expectedTypes)) {
    const source = circuit.db.source_component
      .list()
      .find((s) => s.name === name)!
    expect(any_circuit_element.parse(source)).toMatchObject({
      type: "source_component",
      name,
      ftype,
    })
    expect(
      circuit.db.cad_component
        .list()
        .some((cad) => cad.source_component_id === source.source_component_id),
    ).toBe(true)
  }
})
