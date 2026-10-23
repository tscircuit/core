import { expect, test } from "bun:test"
import { parseCableString } from "@tscircuit/cableprinter"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a named printed-part cable endpoint follows its mounted reference frame", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part name="BASE">
        <assembly.referencesurface
          name="side"
          plane="yz"
          normalDirection="x+"
          centerXOffset={10}
          centerYOffset={20}
          centerZOffset={30}
        />
      </assembly.part>
      <assembly.printedpart
        name="HOLDER"
        mountedTo="BASE.side"
        mountFace="bottom"
        jscad={<jscad.cuboid size={[4, 6, 8]} />}
      >
        <assembly.referencesurface name="bottom" normalDirection="z-" />
        <assembly.referencesurface
          name="socket"
          centerXOffset={2}
          centerYOffset={3}
          centerZOffset={4}
        />
      </assembly.printedpart>
      <board width={30} height={20} routingDisabled>
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={3}
          footprint="jst3_ph"
        />
      </board>
      <assembly.cable
        name="HARNESS"
        from=".J1"
        to="HOLDER.socket"
        model="jst_ph_pins3"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cable = circuit.db.cad_cable.list()[0]!
  const holder = circuit.db.source_component
    .list()
    .find((part) => part.name === "HOLDER")!
  const surface = circuit.db.cad_reference_surface
    .list()
    .find(
      (surface) =>
        surface.source_component_id === holder.source_component_id &&
        surface.name === "socket",
    )!
  const wireExit = cable.path.at(-1)!
  const depth = parseCableString("jst_ph_pins3").connectorB.bodyDepth
  expect(cable.to_source_component_id).toBe(holder.source_component_id)
  expect(surface.center.x).toBeCloseTo(14)
  expect(surface.center.y).toBeCloseTo(22)
  expect(surface.center.z).toBeCloseTo(33)
  expect(wireExit.x).toBeCloseTo(surface.center.x + surface.normal.x * depth)
  expect(wireExit.y).toBeCloseTo(surface.center.y + surface.normal.y * depth)
  expect(wireExit.z).toBeCloseTo(surface.center.z + surface.normal.z * depth)
  expect(cable.to_connector_pin1_position?.x).toBeCloseTo(14)
  expect(cable.to_connector_pin1_position?.y).toBeCloseTo(20)
  expect(cable.to_connector_pin1_position?.z).toBeCloseTo(33)
})
