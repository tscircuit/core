import { expect, test } from "bun:test"
import type { PcbStackup } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit stackup replaces imported metadata without mutating the import", async () => {
  const assumed: PcbStackup = {
    source: "assumed",
    layers: [
      { type: "copper", layer: "top" },
      { type: "dielectric" },
      { type: "copper", layer: "bottom" },
    ],
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={42} height={22} layers={2} stackup={assumed} routingDisabled>
      <pcbnotetext
        text={
          "Imported board with explicit replacement\nASSUMED unknown spacing replaced by\nSPECIFIED 0.5 mm dielectric spacing"
        }
        fontSize={0.8}
        anchorAlignment="center"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const exported = JSON.parse(JSON.stringify(circuit.getCircuitJson()))
  const original = structuredClone(exported)
  const specified: PcbStackup = {
    source: "specified",
    layers: [
      { type: "copper", layer: "top" },
      { type: "dielectric", thickness_mm: 0.5 },
      { type: "copper", layer: "bottom" },
    ],
  }
  const imported = getTestFixture().circuit
  imported.add(
    <board
      layers={2}
      stackup={specified}
      circuitJson={exported}
      routingDisabled
    />,
  )
  await imported.renderUntilSettled()
  expect(imported.db.pcb_board.list()[0].stackup).toEqual(specified)
  expect(exported).toEqual(original)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
