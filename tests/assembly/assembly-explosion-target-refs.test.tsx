import { expect, test } from "bun:test"
import { assembly, getAssemblyExplosion, jscad } from "lib"
import type { CadComponent } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("comma and array targetRefs move parts together while targetRef remains compatible", async () => {
  const panels = []
  const offsets = []
  for (const form of ["comma", "array", "legacy"] as const) {
    const { circuit } = getTestFixture()
    const move =
      form === "legacy" ? (
        <assembly.explosion.move targetRef=" A " offZ="12mm" />
      ) : (
        <assembly.explosion.move
          targetRefs={form === "comma" ? " A, B " : [" A ", "B "]}
          offZ="12mm"
        />
      )
    circuit.add(
      <assembly.device name="PAIR">
        <assembly.part
          name="BASE"
          cadModel={{ jscad: { type: "cuboid", size: [40, 14, 4] } }}
        >
          <assembly.referencesurface
            name="left"
            centerXOffset="-11mm"
            centerZOffset="2mm"
          />
          <assembly.referencesurface
            name="right"
            centerXOffset="11mm"
            centerZOffset="2mm"
          />
        </assembly.part>
        <assembly.printedpart
          name="A"
          color="#d9a15f"
          jscad={<jscad.cuboid size={[8, 8, 6]} center={[0, 0, 3]} />}
          mountedTo="BASE.left"
          mountFace="bottom"
        >
          <assembly.referencesurface name="bottom" normalDirection="z-" />
        </assembly.printedpart>
        <assembly.printedpart
          name="B"
          color="#436f8b"
          jscad={<jscad.cylinder radius={4} height={8} center={[0, 0, 4]} />}
          mountedTo="BASE.right"
          mountFace="bottom"
        >
          <assembly.referencesurface name="bottom" normalDirection="z-" />
        </assembly.printedpart>
        <assembly.explosion.stage name="lift">{move}</assembly.explosion.stage>
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const assembled = structuredClone(circuit.getCircuitJson())
    const exploded = getAssemblyExplosion(circuit)
    const halfway = getAssemblyExplosion(circuit, {
      throughStageRef: "PAIR.lift",
      stageProgress: 0.5,
    })
    const findCad = (name: string, json = assembled) => {
      const source = circuit.db.source_component
        .list()
        .find((part) => part.name === name)!
      return json.find(
        (record): record is CadComponent =>
          record.type === "cad_component" &&
          record.source_component_id === source.source_component_id,
      )!
    }
    const measuredOffsets = ["A", "B", "BASE"].map(
      (name) =>
        findCad(name, exploded.circuitJson).position.z -
        findCad(name).position.z,
    )
    expect(measuredOffsets).toEqual(
      form === "legacy" ? [12, 0, 0] : [12, 12, 0],
    )
    offsets.push(measuredOffsets)
    for (const name of form === "legacy" ? ["A"] : ["A", "B"]) {
      expect(
        findCad(name, halfway.circuitJson).position.z -
          findCad(name).position.z,
      ).toBeCloseTo(6)
      const line = exploded.lines.find((guide) => guide.targetRef === name)!
      expect(line.points[0]).toEqual(findCad(name).position)
      expect(line.points[1]).toEqual(
        findCad(name, exploded.circuitJson).position,
      )
    }
    expect(exploded.lines.map((line) => line.targetRef)).toEqual(
      form === "legacy" ? ["A"] : ["A", "B"],
    )
    expect(circuit.getCircuitJson()).toEqual(assembled)
    expect(getAssemblyExplosion(circuit)).toEqual(exploded)
    panels.push({
      title:
        form === "legacy"
          ? "Legacy single target remains supported"
          : `${form === "comma" ? "Comma string" : "Array"}: both parts lift 12 mm`,
      circuit: assembled,
      code: `<assembly.explosion.stage name="lift">\n  <assembly.explosion.move\n    ${form === "legacy" ? 'targetRef="A"' : form === "comma" ? 'targetRefs="A, B"' : 'targetRefs={["A", "B"]}'}\n    offZ="12mm" />\n</assembly.explosion.stage>`,
      annotation:
        form === "legacy"
          ? "A lifts; B and BASE stay mounted."
          : "One move applies the same displacement to A and B.",
      renderOptions: {
        gltf: { explosion: {} },
        camPos: [65, 45, 55] as [number, number, number],
        poppygl: {
          lookAt: [0, 8, 0] as [number, number, number],
        },
      },
    })
    if (form === "comma") {
      panels.push({
        title: "Half progress moves both selected parts halfway",
        circuit: assembled,
        code: '<assembly.explosion.move\n  targetRefs="A, B" offZ="12mm" />\n\ngetAssemblyExplosion(circuit, {\n  throughStageRef: "PAIR.lift",\n  stageProgress: 0.5,\n})',
        annotation:
          "A and B each lift 6 mm; targets share one move's progress.",
        renderOptions: {
          gltf: {
            explosion: { throughStageRef: "PAIR.lift", stageProgress: 0.5 },
          },
          camPos: [65, 45, 55] as [number, number, number],
          poppygl: {
            lookAt: [0, 8, 0] as [number, number, number],
          },
        },
      })
    }
  }
  expect(offsets[0]).toEqual(offsets[1])
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Explosion targetRefs: simultaneous selection, shared progress, and legacy input",
    columns: 2,
    panels,
  })
})
