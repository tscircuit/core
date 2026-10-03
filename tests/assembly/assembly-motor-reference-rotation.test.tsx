import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"

test("named wireside rotations aim the emitted mesh for all shaft directions", async () => {
  const panels = []
  // Renderer scene is (-circuit X, circuit Z, circuit Y), mm. These expected
  // directions are independent of core's Euler implementation. Wire tips
  // extend 6 mm past the 42.3 mm body; the shaft remains 24 mm long.
  for (const [
    shaft,
    shaftAxis,
    shaftSign,
    zeroAxis,
    zeroSign,
    quarterAxis,
    quarterSign,
  ] of [
    ["z+", 1, 1, 0, -1, 2, 1],
    ["z-", 1, -1, 0, -1, 2, 1],
    ["x+", 0, -1, 2, 1, 1, 1],
    ["x-", 0, 1, 2, 1, 1, 1],
    ["y+", 2, 1, 1, 1, 0, -1],
    ["y-", 2, -1, 1, 1, 0, -1],
  ] as const) {
    for (const angle of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device>
          <assembly.motor
            name="MOTOR"
            standard="nema17"
            shaftFacingDirection={shaft}
            motorRotation={`calc(wireside+${angle}deg)`}
          />
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const json = await withLocalNemaMesh(circuit.getCircuitJson())
      const bounds = await getRenderedMotorBounds(json)
      const wireAxis = angle % 180 === 0 ? zeroAxis : quarterAxis
      const wireSign =
        (angle % 180 === 0 ? zeroSign : quarterSign) * (angle >= 180 ? -1 : 1)
      expect(
        wireSign > 0 ? bounds.max[wireAxis] : -bounds.min[wireAxis],
      ).toBeCloseTo(27.15, 3)
      expect(
        wireSign > 0 ? -bounds.min[wireAxis] : bounds.max[wireAxis],
      ).toBeCloseTo(21.15, 3)
      expect(
        shaftSign > 0 ? bounds.max[shaftAxis] : -bounds.min[shaftAxis],
      ).toBeCloseTo(24, 3)
      if ((shaft === "z+" || shaft === "z-") && (angle === 0 || angle === 90)) {
        panels.push({
          title: `Shaft ${shaft}; wireside ${angle} degrees`,
          code: `<assembly.device>\n  <assembly.motor\n    name="MOTOR"\n    standard="nema17"\n    shaftFacingDirection="${shaft}"\n    motorRotation=\n      "calc(wireside+${angle}deg)"\n  />\n</assembly.device>`,
          annotation: `Wire exit points toward assembly ${angle === 0 ? "+X" : "+Y"}, for either shaft direction.`,
          circuit: json,
          renderOptions: {
            camPos: [-100, 80, 100] as [number, number, number],
            poppygl: { lookAt: [0, -10, 0] as [number, number, number] },
          },
        })
      }
    }
  }
  // Different native wire orientation must give the same requested result.
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.motor
        name="CUSTOM"
        model="nema17_wireangle90deg"
        motorRotation="calc(wireside+90deg)"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const bounds = await getRenderedMotorBounds(
    await withLocalNemaMesh(circuit.getCircuitJson(), 90),
  )
  expect(bounds.max[2]).toBeCloseTo(27.15, 3)
  expect(bounds.max[0]).toBeCloseTo(21.15, 3)
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA17 named wire direction / shaft orientation is independent",
    columns: 2,
    panels,
  })
}, 60000)
