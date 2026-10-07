import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { parseCableString } from "@tscircuit/cableprinter"
import { createBulletCableCircuit } from "./fixtures/bullet-cable"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("grouped bullet assemblies preserve all wires and mate each contact on both layers", async () => {
  const panels = []
  for (const diameter of [2, 3, 3.5, 4, 5, 5.5, 6, 8] as const) {
    for (const pinCount of [2, 3]) {
      for (const layer of ["top", "bottom"] as const) {
        for (const [fromGender, toGender] of [
          ["male", "female"],
          ["female", "male"],
          ["male", "male"],
          ["female", "female"],
        ] as const) {
          const circuit = createBulletCableCircuit({
            diameter,
            pinCount,
            layer,
            fromGender,
            toGender,
          })
          await circuit.renderUntilSettled()
          const cable = circuit.db.cad_cable.list()[0]!
          const genderA = fromGender === "male" ? "female" : "male"
          const genderB = toGender === "male" ? "female" : "male"
          expect(cable.cableprinter_string).toBe(
            `bullet${pinCount}_d${diameter}mm_a${genderA}_b${genderB}`,
          )
          const definition = parseCableString(cable.cableprinter_string)
          expect(definition.connectorA).toMatchObject({
            kind: `bullet_${genderA}`,
            pinCount,
          })
          expect(definition.connectorB).toMatchObject({
            kind: `bullet_${genderB}`,
            pinCount,
          })
          if (definition.crossSection.kind !== "wire_bundle")
            throw new Error("Expected grouped wires")
          expect(definition.crossSection.wires).toHaveLength(pinCount)
          expect(circuit.selectAll(".J1 > port")).toHaveLength(pinCount)
          expect(circuit.selectAll(".J2 > port")).toHaveLength(pinCount)
          expect(
            circuit.db.source_component
              .list()
              .filter((part) => part.ftype === "simple_connector")
              .map((part) => part.pin_count),
          ).toEqual([pinCount, pinCount])
          if (
            diameter === 3.5 &&
            pinCount === 3 &&
            fromGender === "male" &&
            toGender === "female"
          )
            panels.push({
              title: `Three bullet pairs / 3.5 mm / ${layer} layer`,
              code: `<connector name="J1" model="bullet3_d3.5mm_gmale" />
<connector name="J2" model="bullet3_d3.5mm_gfemale" />
<assembly.cable name="POWER"
  from=".J1" to=".J2" />`,
              annotation:
                "bullet3_d3.5mm_afemale_bmale / three insulated wires",
              circuit,
              renderOptions: {
                poppygl: {
                  camPos: [-110, layer === "top" ? 125 : -125, 125] as [
                    number,
                    number,
                    number,
                  ],
                  lookAt: [0, layer === "top" ? 24 : -24, 0] as [
                    number,
                    number,
                    number,
                  ],
                  fov: 40,
                },
              },
            })
        }
      }
    }
  }
  const mismatch = createBulletCableCircuit({
    diameter: 3.5,
    pinCount: 3,
    toPinCount: 2,
  })
  await expect(mismatch.renderUntilSettled()).rejects.toThrow("pin counts")
  expect(mismatch.db.cad_cable.list()).toHaveLength(0)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Grouped bullet cables / three contacts and three wires",
    font: "alphabet",
    columns: 2,
    panels,
  })
})
