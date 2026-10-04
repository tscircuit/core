import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("motor-only face chains resolve their root and direct PCB anchors", async () => {
  for (const withBoard of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        {withBoard && (
          <board
            name="CONTROL"
            width={42}
            height={42}
            thickness={1.6}
            mountedTo="C.backface"
            mountGap={6}
            mountOrientation="bottom_layer_toward_mount_face"
            routingDisabled
          />
        )}
        <assembly.motor
          name="C"
          standard="nema17"
          mountedTo="B.backface"
          mountFace="backface"
          mountGap={2}
        />
        <assembly.motor
          name="B"
          standard="nema17"
          mountedTo="A.backface"
          mountFace="frontface"
          mountGap={2}
        />
        <assembly.motor name="A" standard="nema17" />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const json = await withLocalNemaMesh(circuit.getCircuitJson())
    for (const [name, nativeZ] of [
      ["A", 0],
      ["B", -40],
      ["C", -118],
    ] as const) {
      const source = circuit.db.source_component
        .list()
        .find((s) => s.name === name)!
      const cad = circuit.db.cad_component
        .list()
        .find((c) => c.source_component_id === source.source_component_id)!
      expect(cad.position.z).toBeCloseTo(nativeZ + (withBoard ? 73.2 : 0), 4)
      if (name === "C") {
        const bounds = await getRenderedMotorBounds(
          json.filter(
            (el) =>
              el.type === "cad_component" &&
              el.cad_component_id === cad.cad_component_id,
          ),
        )
        // Rear screw tips protrude 3 mm beyond the body face toward the board.
        expect(bounds.max[1]).toBeCloseTo(withBoard ? -3.8 : -77, 3)
      }
    }
  }
}, 60000)
