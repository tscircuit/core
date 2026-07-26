import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol renders two MOSFET representations without a schematic sheet", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm">
      <chip
        name="Q1"
        footprint="soic8"
        noSchematicRepresentation
        pcbX={0}
        pcbY={0}
        pinLabels={{
          pin1: "G1",
          pin2: "S1",
          pin3: "G2",
          pin4: "S2",
          pin5: "D2",
          pin6: "D2",
          pin7: "D1",
          pin8: "D1",
        }}
      />

      <schematicsymbol
        name="A"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
        connections={{
          gate: "Q1.G1",
          source: "Q1.S1",
          drain: "Q1.D1",
        }}
        schX={-2.5}
      />
      <schematicsymbol
        name="B"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
        connections={{
          gate: "Q1.G2",
          source: "Q1.S2",
          drain: "Q1.D2",
        }}
        schX={2.5}
      />

      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={2}
        schX={-4.5}
        schY={-0.1}
      />
      <led
        name="D1"
        color="red"
        footprint="0603"
        pcbX={5}
        pcbY={2}
        schX={-1}
        schY={0.55}
      />
      <resistor
        name="R2"
        resistance="22k"
        footprint="0402"
        pcbX={-5}
        pcbY={-2}
        schX={0.5}
        schY={-0.1}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={5}
        pcbY={-2}
        schX={4}
        schY={0.55}
      />

      <trace from=".R1 > .pin2" to=".Q1 > .G1" />
      <trace from=".Q1 > .D1" to=".D1 > .pin1" />
      <trace from=".R2 > .pin2" to=".Q1 > .G2" />
      <trace from=".Q1 > .D2" to=".C1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.schematic_component.list({
      symbol_name: "n_channel_e_mosfet_transistor_horz",
    }),
  ).toHaveLength(2)
  expect(
    circuit.db.source_component
      .list()
      .filter((component) => component.name === "A" || component.name === "B")
      .map((component) => component.name)
      .sort(),
  ).toEqual(["A", "B"])
  expect(circuit.db.schematic_trace.list()).toHaveLength(4)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
