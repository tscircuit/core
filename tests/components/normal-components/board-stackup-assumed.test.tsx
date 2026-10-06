import { expect, test } from "bun:test"
import type { PcbStackup } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assumed stackup keeps missing physical quantities unknown", async () => {
  const stackup: PcbStackup = {
    source: "assumed",
    layers: [
      { type: "copper", layer: "top" },
      { type: "dielectric" },
      { type: "copper", layer: "inner1" },
      { type: "dielectric" },
      { type: "copper", layer: "inner2" },
      { type: "dielectric" },
      { type: "copper", layer: "bottom" },
    ],
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={42}
      height={22}
      layers={4}
      material="fr4"
      stackup={stackup}
      routingDisabled
    >
      <pcbnotetext
        text={
          "ASSUMED: top / inner1 / inner2 / bottom\nThickness, Er, conductivity and loss: unknown\nFR4 label supplies no missing quantities"
        }
        fontSize={0.8}
        anchorAlignment="center"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_board.list()[0].stackup).toEqual(stackup)
  const imported = getTestFixture().circuit
  imported.add(
    <subcircuit
      name="Imported physical stackup"
      circuitJson={JSON.parse(JSON.stringify(circuit.getCircuitJson()))}
      routingDisabled
    />,
  )
  await imported.renderUntilSettled()
  expect(imported.db.pcb_board.list()[0]).toMatchObject({
    num_layers: 4,
    stackup,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
