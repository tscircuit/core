import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("courtyard overlap checks use overrides instead of footprint defaults", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} routingDisabled>
      {/* Defaults overlap at 0.9mm; 0.74mm overrides leave a gap. */}
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={-4}
        pcbY={-0.45}
      >
        <courtyardrect width={1.66} height={0.74} />
      </capacitor>
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={-4}
        pcbY={0.45}
      >
        <courtyardrect width={1.66} height={0.74} />
      </capacitor>
      {/* A larger explicit courtyard must still produce an overlap error. */}
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={4}
        pcbY={-1}
      >
        <courtyardrect width={2} height={3} />
      </capacitor>
      <capacitor
        name="C4"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={4}
        pcbY={1}
      >
        <courtyardrect width={2} height={3} />
      </capacitor>
      <pcbnotetext
        pcbX={-4}
        pcbY={3.5}
        text="Tight overrides: clear"
        fontSize={0.5}
      />
      <pcbnotetext
        pcbX={4}
        pcbY={3.5}
        text="Large overrides: overlap"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const errors = circuit.db.pcb_courtyard_overlap_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].pcb_component_ids).toEqual([
    circuit.selectOne(".C3")!.pcb_component_id!,
    circuit.selectOne(".C4")!.pcb_component_id!,
  ])
  expect(circuit.db.pcb_footprint_overlap_error.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    shouldDrawErrors: true,
  })
})
