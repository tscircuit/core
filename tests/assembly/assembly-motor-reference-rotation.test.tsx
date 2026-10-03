import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("board edges align to named motor directions with explicit face-relative turns", async () => {
  const panels = []
  for (const orientation of [
    "top_layer_toward_mount_face",
    "bottom_layer_toward_mount_face",
  ] as const) {
    for (const [anchor, angle] of [
      ["rightedge", 0],
      ["topedge", 90],
      ["leftedge", 180],
      ["bottomedge", 270],
    ] as const) {
      for (const expression of [
        "MOTOR.wireside",
        "calc(MOTOR.wireside+90degcw)",
        "calc(MOTOR.wireside-90degccw)",
      ]) {
        const { circuit } = getTestFixture()
        circuit.add(
          <assembly.device>
            <assembly.motor name="MOTOR" model="nema17_wireangle90deg" />
            <board
              width={42}
              height={42}
              mountedTo="MOTOR.backface"
              mountGap={6}
              mountRotationAnchor={anchor}
              mountRotation={expression}
              mountOrientation={orientation}
              routingDisabled
            />
          </assembly.device>,
        )
        await circuit.renderUntilSettled()
        const sign = orientation === "top_layer_toward_mount_face" ? 1 : -1
        const wireAngle =
          (angle - (expression === "MOTOR.wireside" ? 0 : sign * 90) + 360) %
          360
        const axis = wireAngle % 180 === 0 ? 0 : 2
        const wireSign = (wireAngle >= 180 ? -1 : 1) * (axis === 0 ? -1 : 1)
        const json = await withLocalNemaMesh(circuit.getCircuitJson(), 90)
        const bounds = await getRenderedMotorBounds(json)
        expect(wireSign > 0 ? bounds.max[axis] : -bounds.min[axis]).toBeCloseTo(
          27.15,
          3,
        )
        expect(wireSign > 0 ? -bounds.min[axis] : bounds.max[axis]).toBeCloseTo(
          21.15,
          3,
        )
        if (anchor === "topedge" && expression === "MOTOR.wireside")
          panels.push({
            title: `topedge; ${orientation}`,
            code: `<assembly.device>\n  <assembly.motor name="MOTOR"\n    model="nema17_wireangle90deg" />\n  <board width={42} height={42}\n    mountedTo="MOTOR.backface"\n    mountRotationAnchor="topedge"\n    mountRotation="MOTOR.wireside"\n    mountOrientation="${orientation}"\n  />\n</assembly.device>`,
            annotation:
              "The top edge points toward the actual wire exit, including a custom native wire angle.",
            circuit: json,
            renderOptions: {
              camPos: [-100, sign * 80, 100] as [number, number, number],
              poppygl: {
                lookAt: [0, sign * 20, 0] as [number, number, number],
              },
            },
          })
      }
    }
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA17 edge alignment",
    panels,
  })
}, 60000)
