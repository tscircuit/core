import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { assembly } from "lib"
import { Fragment } from "react"
import { RootCircuit } from "lib/RootCircuit"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("assembly.cable renders an explicitly selected model between different endpoints", async () => {
  const panels = []
  for (const { model, standards, pinCount, pitches, heights, title } of [
    {
      model: "adaptercable_a(jst_sh_pins4)_b(jst_ph_pins4)",
      standards: ["jst_sh", "jst_ph"],
      pinCount: 4,
      pitches: [1, 2],
      heights: [4.25, 6],
      title: "JST SH to PH",
    },
    {
      model: "adaptercable_a(bullet3_d3.5mm_gfemale)_b(bullet3_d4mm_gfemale)",
      standards: [undefined, undefined],
      pinCount: 3,
      pitches: [5.5, 6],
      heights: [12.25, 14],
      title: "Three contacts / 3.5 mm to 4 mm",
    },
  ] as const) {
    const circuit = new RootCircuit()
    circuit.add(
      <assembly.device>
        <board width={65} height={30} routingDisabled>
          {standards.map((standard, index) => (
            <connector
              key={index}
              name={`J${index + 1}`}
              standard={standard}
              pinCount={pinCount}
              pcbX={index ? 20 : -20}
              cadModel={{
                jscad: {
                  type: "cuboid",
                  size: [16, 4, heights[index]!],
                  center: [0, 0, heights[index]! / 2],
                },
              }}
              footprint={
                <footprint>
                  {Array.from({ length: pinCount }, (_, pin) => pin).map(
                    (pin) => (
                      <Fragment key={pin}>
                        <platedhole
                          pcbX={(pin - (pinCount - 1) / 2) * pitches[index]!}
                          portHints={[`pin${pin + 1}`]}
                          holeDiameter={0.5}
                          outerDiameter={0.8}
                          shape="circle"
                        />
                      </Fragment>
                    ),
                  )}
                </footprint>
              }
            />
          ))}
        </board>
        <assembly.cable name="C1" from=".J1" to=".J2" model={model} />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const cable = circuit.db.cad_cable.list()[0]!
    expect(cable.cableprinter_string).toBe(model)
    expect(cable.path.length).toBeGreaterThan(2)
    expect(
      circuit.db.source_component
        .list()
        .filter((c) => c.ftype === "simple_connector")
        .map((c) => c.standard),
    ).toEqual([...standards])
    panels.push({
      title,
      code: `<assembly.cable name="C1"\n  from=".J1" to=".J2"\n  model={\n    "${model.split("_b(")[0]}" +\n    "_b(${model.split("_b(")[1]}"\n  } />`,
      annotation:
        "Model specifies the cable; connector standards remain unchanged",
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
    title: "Explicit cable model / independent connector ends",
    font: "alphabet",
    panels,
  })
})
