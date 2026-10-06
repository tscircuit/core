import { expect, test } from "bun:test"
import type { PcbStackup } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supplied physical stackup survives actual TSX rendering and JSON import", async () => {
  const stackup: PcbStackup = {
    source: "specified",
    layers: [
      {
        type: "copper",
        layer: "top",
        thickness_mm: 0.035,
        conductivity_s_per_m: 5.8e7,
      },
      {
        type: "dielectric",
        material: "Generic test dielectric",
        thickness_mm: 0.2,
        dielectric_constant: 4.1,
        dielectric_constant_frequency_hz: 1e9,
        dielectric_loss_tangent: 0.02,
        dielectric_loss_tangent_frequency_hz: 1e9,
      },
      { type: "copper", layer: "bottom" },
    ],
  }
  const original = structuredClone(stackup)
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={42} height={22} layers={2} stackup={stackup} routingDisabled>
      <pcbnotetext
        text={
          "Specified physical stackup\nTop / 0.2 mm dielectric / bottom\nEr 4.1 and loss 0.02 supplied at 1 GHz"
        }
        fontSize={0.8}
        anchorAlignment="center"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const exported = circuit.getCircuitJson()
  expect(circuit.db.pcb_board.list()[0].stackup).toEqual(stackup)
  expect(stackup).toEqual(original)

  const imported = getTestFixture().circuit
  imported.add(
    <board
      layers={2}
      circuitJson={JSON.parse(JSON.stringify(exported))}
      routingDisabled
    />,
  )
  await imported.renderUntilSettled()
  expect(imported.db.pcb_board.list()[0].stackup).toEqual(stackup)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
