import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { assembly } from "lib"
import { RootCircuit } from "lib/RootCircuit"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("assembly.cable renders an explicitly selected model between different endpoints", async () => {
  const circuit = new RootCircuit()
  const model = "adaptercable_a(jst_sh_pins4)_b(jst_ph_pins4)"
  circuit.add(
    <assembly.device>
      <board width={65} height={30} routingDisabled>
        {(["jst_sh", "jst_ph"] as const).map((standard, index) => (
          <connector
            key={standard}
            name={`J${index + 1}`}
            standard={standard}
            pinCount={4}
            pcbX={index ? 20 : -20}
            cadModel={{
              jscad: {
                type: "cuboid",
                size: [10, 4, index ? 6 : 4.25],
                center: [0, 0, index ? 3 : 2.125],
              },
            }}
            footprint={
              <footprint>
                {[0, 1, 2, 3].map((pin) => (
                  <platedhole
                    key={pin}
                    pcbX={(pin - 1.5) * (index ? 2 : 1)}
                    portHints={[`pin${pin + 1}`]}
                    holeDiameter={0.5}
                    outerDiameter={0.8}
                    shape="circle"
                  />
                ))}
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
  ).toEqual(["jst_sh", "jst_ph"])
  await expectAssemblySnapshot(import.meta.path, {
    title: "Explicit cable model / independent connector ends",
    font: "alphabet",
    panels: [
      {
        title: "JST SH to PH / four contacts",
        code: `<assembly.cable name="C1"\n  from=".J1" to=".J2"\n  model="adaptercable_a(jst_sh_pins4)_b(jst_ph_pins4)" />`,
        annotation:
          "Model specifies the cable; existing connector standards remain unchanged",
        circuit,
        renderOptions: {
          poppygl: { camPos: [-75, 75, 85], lookAt: [0, 20, 0], fov: 40 },
        },
      },
    ],
  })
})
