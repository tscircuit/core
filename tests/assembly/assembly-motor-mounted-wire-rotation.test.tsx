import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("board-owned connector alignment uses finalized PCB geometry on either face", async () => {
  const panels = []
  for (const orientation of [
    "top_layer_toward_mount_face",
    "bottom_layer_toward_mount_face",
  ] as const) {
    for (const pcbRotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device>
          <board
            name="CONTROLLER"
            width={42}
            height={42}
            pcbX={12}
            pcbY={-8}
            pcbRotation={pcbRotation}
            mountedTo="MOTOR.backface"
            mountGap={6}
            mountRotationAnchor="USB_BOARD.J_USB"
            mountRotation="calc(MOTOR.wireside-90degcw)"
            mountOrientation={orientation}
            routingDisabled
          >
            <group name="USB_BOARD" pcbX={4} pcbY={2}>
              <chip
                name="J_USB"
                footprint="soic8"
                pcbX={-4}
                pcbY={13.5}
                cadModel={null}
              />
            </group>
            <hole diameter={3.2} pcbX={-15.5} pcbY={-15.5} />
            <hole diameter={3.2} pcbX={15.5} pcbY={-15.5} />
          </board>
          <assembly.motor name="MOTOR" standard="nema17" />
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const pcb = circuit.db.pcb_component
        .list()
        .find(
          (component) =>
            circuit.db.source_component.get(component.source_component_id!)
              ?.name === "J_USB",
        )!
      const board = circuit.db.pcb_board.list()[0]!
      const dx = pcb.center.x - board.center.x,
        dy = pcb.center.y - board.center.y
      const sign = orientation === "top_layer_toward_mount_face" ? 1 : -1
      // anchor = wireside -90degcw; derive wireside from the emitted connector.
      const target = [-sign * dy, sign * dx]
      const sceneAxis = Math.abs(target[0]!) > Math.abs(target[1]!) ? 0 : 2
      const sceneSign = Math.sign(sceneAxis === 0 ? -target[0]! : target[1]!)
      const json = await withLocalNemaMesh(circuit.getCircuitJson())
      const cad = circuit.db.cad_component.list()[0]!
      const bounds = await getRenderedMotorBounds(json)
      const center = sceneAxis === 0 ? -cad.position.x : cad.position.y
      expect(
        sceneSign > 0
          ? bounds.max[sceneAxis] - center
          : center - bounds.min[sceneAxis],
      ).toBeCloseTo(27.15, 3)
      expect(cad.position.z).toBeCloseTo(sign * 44.7, 3)
      expect(
        sign > 0
          ? bounds.max[1] - cad.position.z
          : cad.position.z - bounds.min[1],
      ).toBeCloseTo(24, 3)
      if (pcbRotation === 90)
        panels.push({
          title: orientation,
          code: `<assembly.device>\n  <assembly.motor name="MOTOR"\n    standard="nema17" />\n  <Rp2040MotorController\n    mountedTo="MOTOR.backface"\n    mountGap={6}\n    mountRotationAnchor="USB_BOARD.J_USB"\n    mountRotation="calc(MOTOR.wireside-90degcw)"\n    mountOrientation="${orientation}"\n  />\n</assembly.device>`,
          annotation:
            "Connector direction is 90 degrees counterclockwise from the wire exit when looking at the backface. Gap: 6 mm.",
          circuit: json,
          renderOptions: {
            camPos: [110, sign * 100, 110] as [number, number, number],
            poppygl: {
              lookAt: [-12, sign * 20, -8] as [number, number, number],
            },
          },
        })
    }
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Board-owned NEMA17 connector alignment",
    panels,
  })
}, 60000)
