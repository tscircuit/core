import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { parseCableString } from "@tscircuit/cableprinter"
import { createBulletCableCircuit } from "./fixtures/bullet-cable"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("bullet cables infer each mating gender and preserve all diameters on both PCB layers", async () => {
  const panels = []
  for (const diameter of [2, 3, 3.5, 4, 5, 5.5, 6, 8] as const) {
    for (const layer of ["top", "bottom"] as const) {
      for (const [fromGender, toGender] of [
        ["male", "female"],
        ["female", "male"],
        ["male", "male"],
        ["female", "female"],
      ] as const) {
        const circuit = createBulletCableCircuit({
          diameter,
          layer,
          fromGender,
          toGender,
        })
        await circuit.renderUntilSettled()
        const cable = circuit.db.cad_cable.list()[0]!
        const genderA = fromGender === "male" ? "female" : "male"
        const genderB = toGender === "male" ? "female" : "male"
        expect(cable.cableprinter_string).toBe(
          `bullet_d${diameter}mm_a${genderA}_b${genderB}`,
        )
        const definition = parseCableString(cable.cableprinter_string)
        expect(definition.connectorA.kind).toBe(`bullet_${genderA}`)
        expect(definition.connectorB.kind).toBe(`bullet_${genderB}`)
        expect(cable.path[0]!.z > 0).toBe(layer === "top")
        expect(cable.path.at(-1)!.z > 0).toBe(layer === "top")
        expect(
          circuit.db.source_component
            .list()
            .filter((part) => part.ftype === "simple_connector")
            .map((part) => part.pin_count),
        ).toEqual([1, 1])
        if (fromGender === "male" && toGender === "female")
          panels.push({
            title: `Bullet / ${diameter} mm / ${layer} layer`,
            code: `<connector name="J1" standard="bullet"
  bulletDiameter={${diameter}} bulletGender="male" />
<connector name="J2" standard="bullet"
  bulletDiameter={${diameter}} bulletGender="female" />
<assembly.cable name="POWER"
  from=".J1" to=".J2" standard="bullet" />`,
            annotation:
              "Cable ends mate with the opposite gender; one insulated conductor.",
            circuit,
            renderOptions: {
              poppygl: {
                camPos: [-110, layer === "top" ? 125 : -125, 125] as [
                  number,
                  number,
                  number,
                ],
                lookAt: [
                  0,
                  (layer === "top" ? 1 : -1) * (diameter * 3.5 + 12),
                  0,
                ] as [number, number, number],
                fov: 40,
              },
            },
          })
      }
    }
  }
  const mismatch = createBulletCableCircuit({ diameter: 3.5, toDiameter: 4 })
  await expect(mismatch.renderUntilSettled()).rejects.toThrow(
    "bullet diameters",
  )
  expect(mismatch.db.cad_cable.list()).toHaveLength(0)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Bullet cables / inferred mating genders and nominal diameters",
    columns: 2,
    font: "alphabet",
    panels,
  })
})
