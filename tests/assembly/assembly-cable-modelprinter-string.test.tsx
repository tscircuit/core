import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { assembly } from "lib"
import { RootCircuit } from "lib/RootCircuit"
import { createBulletCableCircuit } from "./fixtures/bullet-cable"

test("connector model strings resolve grouped adapter ends and survive inflation", async () => {
  const circuit = createBulletCableCircuit({
    diameter: 3.5,
    toDiameter: 4,
    pinCount: 3,
    fromGender: "male",
    toGender: "male",
    useModelprinterString: true,
    modelStandard: "jst_ph",
  })
  await circuit.renderUntilSettled()
  const connectors = circuit.db.source_component
    .list()
    .filter((c) => c.ftype === "simple_connector")
  expect(connectors.map((c) => c.modelprinter_string)).toEqual([
    "bullet3_d3.5mm_gmale",
    "bullet3_d4mm_gmale",
  ])
  for (const connector of connectors) {
    expect(connector.standard).toBe("jst_ph")
    expect("bullet_diameter" in connector).toBe(false)
    expect("bullet_gender" in connector).toBe(false)
  }
  expect(
    circuit.db.cad_component
      .list()
      .map((c) => c.model_glb_url)
      .filter(Boolean),
  ).toEqual([
    "https://modelcdn.tscircuit.com/jscad_models/bullet3_d3.5mm_gmale.glb",
    "https://modelcdn.tscircuit.com/jscad_models/bullet3_d4mm_gmale.glb",
  ])
  const cableString =
    "adaptercable_a(bullet3_d3.5mm_gfemale)_b(bullet3_d4mm_gfemale)"
  expect(circuit.db.cad_cable.list()[0]!.cableprinter_string).toBe(cableString)
  const imported = new RootCircuit()
  imported.add(
    <assembly.device>
      <board width={70} height={30} routingDisabled>
        <subcircuit
          name="IMPORTED"
          circuitJson={circuit
            .getCircuitJson()
            .filter(
              (elm) =>
                !["cad_cable", "pcb_board", "cad_assembly"].includes(elm.type),
            )}
        />
      </board>
      <assembly.cable name="ADAPTER" from=".J1" to=".J2" />
    </assembly.device>,
  )
  await imported.renderUntilSettled()
  expect(imported.db.cad_cable.list()[0]!.cableprinter_string).toBe(cableString)
})
