import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("solderjumper options/variations", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="30mm">
      <solderjumper
        name="SJ_fp_default"
        footprint="solderjumper2"
        pcbX={0}
        pcbY={4}
        schX={0}
        schY={0.5}
      />
      <solderjumper
        name="SJ_fp_bridged12"
        footprint="solderjumper2_bridged12"
        pcbX={0}
        pcbY={6}
        schX={0}
        schY={1.5}
      />
      <solderjumper
        name="SJ_prop_bridged12"
        footprint="solderjumper2"
        bridgedPins={[["1", "2"]]}
        pcbX={0}
        pcbY={10}
        schX={0}
        schY={3}
      />
      <solderjumper
        name="SJ_fp_count3_bridged13"
        footprint="solderjumper3_bridged13"
        pinCount={3}
        pcbX={0}
        pcbY={14}
        schX={0}
        schY={4.5}
      />
      <solderjumper
        name="SJ_prop_all_bridged"
        pinCount={3}
        bridgedPins={[["1", "2", "3"]]}
        pcbX={0}
        pcbY={18}
        schX={0}
        schY={6}
      />
        schX={0}
        schY={0}
      />
      <solderjumper
        name="SJ2"
        footprint="solderjumper2_bridged12"
        pcbX={0}
        pcbY={4}
        schX={0}
        schY={2}
      />
      <solderjumper
        name="SJ3"
        footprint="solderjumper2"
        bridgedPins={[["1", "2"]]}
        pcbX={0}
        pcbY={8}
        schX={0}
        schY={4}
      />
      <solderjumper
        name="SJ4"
        footprint="solderjumper3_bridged13"
        pinCount={3}
        pcbX={0}
        pcbY={12}
        schX={0}
        schY={6}
      />
      <solderjumper
        name="SJ5"
        pinCount={3}
        bridgedPins={[["1", "2", "3"]]}
        pcbX={0}
        pcbY={16}
        schX={0}
        schY={8}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
