import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("named motor rotation follows the mounted PCB axes on either side", async () => {
  const panels = []
  for (const shaft of ["z+", "z-"] as const) {
    for (const pcbRotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device>
          <assembly.motor
            name="MOTOR"
            standard="nema17"
            shaftFacingDirection={shaft}
            motorRotation="calc(wireside+90deg)"
          />
          <board
            name="CONTROLLER"
            width={42}
            height={42}
            pcbX={12}
            pcbY={-8}
            pcbRotation={pcbRotation}
            mountedTo="MOTOR.backface"
            mountGap={6}
            routingDisabled
          >
            <hole diameter={3.2} pcbX={-15.5} pcbY={-15.5} />
            <hole diameter={3.2} pcbX={15.5} pcbY={-15.5} />
          </board>
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      // Derive the requested +90 degree direction from emitted PCB holes,
      // rather than reconstructing core's board transform.
      const [left, right] = circuit.db.pcb_hole.list()
      const holeDx = right!.x - left!.x,
        holeDy = right!.y - left!.y
      const target = [-holeDy, holeDx]
      const sceneAxis = Math.abs(target[0]!) > Math.abs(target[1]!) ? 0 : 2
      const sceneSign = Math.sign(sceneAxis === 0 ? -target[0]! : target[1]!)
      const json = await withLocalNemaMesh(circuit.getCircuitJson())
      const cad = circuit.db.cad_component.list()[0]!
      const bounds = await getRenderedMotorBounds(json)
      const center = sceneAxis === 0 ? -cad.position.x : cad.position.y
      const tipDistance =
        sceneSign > 0
          ? bounds.max[sceneAxis] - center
          : center - bounds.min[sceneAxis]
      expect(tipDistance).toBeCloseTo(27.15, 3)
      // PCB surface is ±0.7 mm; rear face is 6 mm away and shaft origin
      // another 38 mm beyond it. Turning the motor does not alter the gap.
      expect(Math.abs(cad.position.z)).toBeCloseTo(44.7, 3)
      if (pcbRotation === 90)
        panels.push({
          title: `Backface mount, shaft ${shaft}, PCB rotated 90 degrees`,
          code: `<assembly.device>\n  <assembly.motor name="MOTOR"\n    standard="nema17"\n    shaftFacingDirection="${shaft}"\n    motorRotation=\n      "calc(wireside+90deg)" />\n  <board name="CONTROLLER"\n    width={42} height={42}\n    mountedTo="MOTOR.backface"\n    mountGap={6}\n    pcbRotation={90} />\n</assembly.device>`,
          annotation:
            "Wires follow PCB +Y; shaft direction and 6 mm mounting gap are preserved.",
          circuit: json,
          renderOptions: {
            camPos: [110, shaft === "z+" ? 100 : -100, 110] as [
              number,
              number,
              number,
            ],
            poppygl: {
              lookAt: [-12, shaft === "z+" ? 20 : -20, -8] as [
                number,
                number,
                number,
              ],
            },
          },
        })
    }
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA17 wireside rotation follows the mounted board",
    panels,
  })
}, 60000)
