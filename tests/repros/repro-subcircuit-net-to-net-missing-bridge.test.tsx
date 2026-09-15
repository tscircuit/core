import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Repro only: do not replace the net-to-net trace with explicit pin anchors.
// Expected fix: throw an error for this cross-subcircuit net-to-net connection.
// This snapshot records the current silent, disconnected PCB result.
test("parent net-to-net trace silently leaves child subcircuits disconnected", async () => {
  const { circuit } = getTestFixture({
    platform: { schematicDisabled: true },
  })
  circuit.add(
    <board width={40} height={20} autorouter="auto">
      <subcircuit name="LEFT" pcbX={-10} schX={-6} autorouter="auto">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-2}
          schX={-1.5}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={2}
          schX={1.5}
        />
        <net name="BUS" />
        <trace from=".R1 .pin2" to="net.BUS" />
        <trace from=".R2 .pin1" to="net.BUS" />
      </subcircuit>
      <subcircuit name="RIGHT" pcbX={10} schX={6} autorouter="auto">
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-2}
          schX={-1.5}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={2}
          schX={1.5}
        />
        <net name="BUS" />
        <trace from=".R3 .pin2" to="net.BUS" />
        <trace from=".R4 .pin1" to="net.BUS" />
      </subcircuit>
      <trace from=".LEFT net.BUS" to=".RIGHT net.BUS" />
      <pcbnotetext pcbX={-10} pcbY={2} fontSize={0.6} text="LEFT / BUS" />
      <pcbnotetext pcbX={10} pcbY={2} fontSize={0.6} text="RIGHT / BUS" />
      <pcbnotetext
        pcbX={0}
        pcbY={6}
        fontSize={0.55}
        text="Missing error: LEFT.BUS to RIGHT.BUS"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
