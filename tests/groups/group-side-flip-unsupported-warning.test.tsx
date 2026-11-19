import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bottom-side groups warn about calculated placement and pin-header text", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={32} height={20} schematicDisabled routingDisabled>
      <group name="calculated" pcbX={-6} layer="bottom">
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={2} />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0603"
          pcbX="calc(R1.x + 3mm)"
        />
      </group>
      <group name="headers" pcbX={8} layer="bottom">
        <pinheader
          name="J1"
          pinCount={3}
          pcbOrientation="vertical"
          showSilkscreenPinLabels
        />
      </group>
      <pcbnotetext
        text="Calc group stays top | Header flips with a text rotation warning"
        pcbY={7}
        fontSize={0.45}
      />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.source_property_ignored_warning.list()
  expect(warnings.map(({ message }) => message)).toEqual([
    "Group calculated keeps its authored side because R2 uses non-numeric PCB placement. Bottom-side groups require numeric member coordinates.",
    "Pin header J1 uses its existing silkscreen text rotation rules in a bottom-side group. Flip the header explicitly to mirror its labels.",
  ])
  expect(circuit.db.pcb_component.list().map(({ layer }) => layer)).toEqual([
    "top",
    "top",
    "bottom",
  ])
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
