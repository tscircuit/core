import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { parseCableString } from "@tscircuit/cableprinter"
import { assembly } from "lib"
import { RootCircuit } from "lib/RootCircuit"
import { Fragment } from "react"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("assembly cables compose mixed families and support an explicit adapter preset", async () => {
  const panels = []
  for (const [fromStandard, toStandard, pinCount, forceAdapter] of [
    ["jst_sh", "jst_ph", 4, false],
    ["bullet", "jst_ph", 3, false],
    ["jst_sh", "jst_sh", 4, true],
  ] as const) {
    const circuit = new RootCircuit()
    const connector = (
      standard: typeof fromStandard | typeof toStandard,
      name: string,
      pcbX: number,
    ) => {
      const pitch = standard === "bullet" ? 5.5 : standard === "jst_sh" ? 1 : 2
      const height =
        standard === "bullet" ? 12.25 : standard === "jst_sh" ? 4.25 : 6
      return (
        <connector
          name={name}
          standard={standard}
          pinCount={pinCount}
          pcbX={pcbX}
          {...(standard === "bullet"
            ? { bulletDiameter: 3.5, bulletGender: "male" as const }
            : {})}
          cadModel={{
            jscad: {
              type: "cuboid",
              size: [(pinCount - 1) * pitch + 4, 4, height],
              center: [0, 0, height / 2],
            },
          }}
          footprint={
            <footprint>
              {Array.from({ length: pinCount }, (_, pin) => (
                <Fragment key={`pin${pin + 1}`}>
                  <platedhole
                    pcbX={(pin - (pinCount - 1) / 2) * pitch}
                    portHints={[`pin${pin + 1}`]}
                    holeDiameter={0.5}
                    outerDiameter={0.8}
                    shape="circle"
                  />
                </Fragment>
              ))}
            </footprint>
          }
        />
      )
    }
    circuit.add(
      <assembly.device>
        <board width={65} height={30} routingDisabled>
          {connector(fromStandard, "J1", -20)}
          {connector(toStandard, "J2", 20)}
        </board>
        <assembly.cable
          name="ADAPTER"
          from=".J1"
          to=".J2"
          standard={forceAdapter ? "adaptercable" : undefined}
        />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const cable = circuit.db.cad_cable.list()[0]!
    const a =
      fromStandard === "bullet"
        ? "bullet3_d3.5mm_gfemale"
        : `jst_sh_pins${pinCount}`
    const b = `${toStandard}_pins${pinCount}`
    expect(cable.cableprinter_string).toBe(`adaptercable_a(${a})_b(${b})`)
    const definition = parseCableString(cable.cableprinter_string)
    expect(definition.standard).toBe("adaptercable")
    expect(definition.connectorA).toMatchObject({ pinCount })
    expect(definition.connectorB).toMatchObject({ pinCount })
    expect(definition.crossSection.kind).toBe("wire_bundle")
    if (definition.crossSection.kind !== "wire_bundle")
      throw new Error("Expected independently pitched wires")
    expect(definition.crossSection.wires).toHaveLength(pinCount)
    panels.push({
      title: `${fromStandard} -> ${toStandard} / ${pinCount} contacts`,
      code: `<connector name="J1"\n  standard="${fromStandard}" pinCount={${pinCount}}\n${fromStandard === "bullet" ? '  bulletDiameter={3.5}\n  bulletGender="male"\n' : ""}  footprint={fromFootprint} />\n<connector name="J2"\n  standard="${toStandard}" pinCount={${pinCount}}\n  footprint={toFootprint} />\n<assembly.cable name="ADAPTER"\n  from=".J1" to=".J2"${forceAdapter ? '\n  standard="adaptercable"' : ""} />`,
      annotation:
        "Independent end families / native contact pitches / representative header bodies",
      circuit,
      renderOptions: {
        poppygl: {
          camPos: [-75, 75, 85] as [number, number, number],
          lookAt: [0, 20, 0] as [number, number, number],
          fov: 40,
        },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Generic adapter cables / mixed connector families",
    font: "alphabet",
    columns: 1,
    panels,
  })
})
