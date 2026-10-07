import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { parseCableString } from "@tscircuit/cableprinter"
import { createBldcBulletAdapterCircuit } from "./fixtures/bldc-bullet-adapter"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("BLDC CAD male outputs connect to 4 mm board contacts through three adapter leads", async () => {
  const panels = []
  for (const boardGender of ["male", "female"] as const) {
    const circuit = createBldcBulletAdapterCircuit({ boardGender })
    await circuit.renderUntilSettled()
    const cable = circuit.db.cad_cable.list()[0]!
    const definition = parseCableString(cable.cableprinter_string)
    expect(cable.cableprinter_string).toBe(
      `adaptercable_a(bullet3_d3.5mm_gfemale)_b(bullet3_d4mm_g${boardGender === "male" ? "female" : "male"})`,
    )
    expect(definition.connectorA).toMatchObject({
      diameter: 3.5,
      kind: "bullet_female",
      pinCount: 3,
    })
    expect(definition.connectorB).toMatchObject({
      diameter: 4,
      kind: boardGender === "male" ? "bullet_female" : "bullet_male",
      pinCount: 3,
    })
    expect(
      circuit.db.source_component.get(cable.from_source_component_id)?.name,
    ).toBe("MOTOR")
    expect(
      circuit.db.source_component.get(cable.to_source_component_id)?.name,
    ).toBe("J_PHASES")
    // Independently measured from the fixture CAD: outputs are centered at
    // (-35,4,32.25), then the female cable body's 12.25 mm extends along +Z.
    expect(cable.path[0]!.x).toBeCloseTo(-35)
    expect(cable.path[0]!.y).toBeCloseTo(4)
    expect(cable.path[0]!.z).toBeCloseTo(44.5)
    panels.push({
      title: `BLDC / 3.5 mm male -> 4 mm ${boardGender} board`,
      code: `<assembly.subassembly name="MOTOR"\n  cadModel={motorCad}\n  cableConnectors={{ phases: {\n    model: "bullet3_d3.5mm_gmale",\n    position: { x: 3, y: 4, z: 32.25 },\n    facingDirection: "z+"\n  } }} />\n<connector name="J_PHASES"\n  model="bullet3_d4mm_g${boardGender}"\n  footprint={bulletFootprint} />\n<assembly.cable name="PHASE_LEADS"\n  from="MOTOR.phases" to=".J_PHASES" />`,
      annotation:
        "Three phase wires / 3.5 mm female motor end / 4 mm board end",
      circuit,
      renderOptions: {
        poppygl: {
          camPos: [-115, 115, 130] as [number, number, number],
          lookAt: [-12, 20, 0] as [number, number, number],
          fov: 40,
        },
      },
    })
  }
  for (const [rotation, x, y] of [
    [90, -42, 3],
    [180, -41, -4],
    [270, -34, -3],
  ] as const) {
    const circuit = createBldcBulletAdapterCircuit({ rotation })
    await circuit.renderUntilSettled()
    const point = circuit.db.cad_cable.list()[0]!.path[0]!
    expect(point.x).toBeCloseTo(x)
    expect(point.y).toBeCloseTo(y)
    expect(point.z).toBeCloseTo(44.5)
  }
  for (const [circuit, message] of [
    [createBldcBulletAdapterCircuit({ toPinCount: 2 }), "pin counts"],
    [
      createBldcBulletAdapterCircuit({ from: "MOTOR.missing" }),
      "no cable connector",
    ],
  ] as const)
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
  await expectAssemblySnapshot(import.meta.path, {
    title: "BLDC motor to board / 3.5 mm to 4 mm bullet adapter cables",
    font: "alphabet",
    columns: 2,
    panels,
  })
})
