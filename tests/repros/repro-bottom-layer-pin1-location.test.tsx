import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getRotationBetweenPcbPin1Locations } from "circuit-json"
import { Board } from "lib/components/normal-components/Board/Board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getMatchingSoic8PartsEngine = async (): Promise<PartsEngine> => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} routingDisabled>
      <chip name="U_SUPPLIER" footprint="soic8" />
    </board>,
  )
  await circuit.renderUntilSettled()

  return {
    findPart: async () => ({ jlcpcb: ["C_SOIC8"] }),
    fetchPartCircuitJson: async () => circuit.getCircuitJson(),
  }
}

const soic8Placements = [
  { name: "U1", layer: "top", pcbRotation: 0, pcbX: -24 },
  { name: "U2", layer: "bottom", pcbRotation: 0, pcbX: -12 },
  { name: "U3", layer: "bottom", pcbRotation: 90, pcbX: 0 },
  { name: "U4", layer: "bottom", pcbRotation: 180, pcbX: 12 },
  { name: "U5", layer: "bottom", pcbRotation: 270, pcbX: 24 },
] as const

test("repro: bottom-layer parts report the wrong pin 1 location at 0 and 180 degrees", async () => {
  const partsEngine = await getMatchingSoic8PartsEngine()
  const { circuit } = getTestFixture()
  const board = new Board({
    width: 62,
    height: 20,
    routingDisabled: true,
    partsEngine,
  })
  circuit.add(board)
  for (const { name, layer, pcbRotation, pcbX } of soic8Placements) {
    board.add(
      <chip
        name={name}
        footprint="soic8"
        layer={layer}
        pcbRotation={pcbRotation}
        pcbX={pcbX}
        supplierPartNumbers={{ jlcpcb: ["C_SOIC8"] }}
      />,
    )
    board.add(
      <pcbnotetext
        text={`${name} ${layer} ${pcbRotation} deg`}
        pcbX={pcbX}
        pcbY={6}
        fontSize={0.8}
      />,
    )
  }
  await circuit.renderUntilSettled()

  const pcbComponentByName = Object.fromEntries(
    soic8Placements.map(({ name }) => {
      const sourceComponent = circuit.db.source_component.select(`.${name}`)!
      const pcbComponent = circuit.db.pcb_component.getWhere({
        source_component_id: sourceComponent.source_component_id,
      })!
      return [name, pcbComponent]
    }),
  )

  // The SOIC-8 footprint is identical to the supplier footprint, so every
  // part should keep leftside_top and need no supplier rotation adjustment.
  // Bottom-layer parts at 0 and 180 degrees currently report rightside_bottom,
  // which turns into a 180 degree JLCPCB pick-and-place correction.
  expect(
    soic8Placements.map(({ name }) => pcbComponentByName[name]!.pin1_location),
  ).toEqual([
    "leftside_top",
    "rightside_bottom",
    "leftside_top",
    "rightside_bottom",
    "leftside_top",
  ])

  for (const { name, pcbX } of soic8Placements) {
    const pcbComponent = pcbComponentByName[name]!
    const supplierPin1Location =
      pcbComponent.supplier_pin1_location_map!.jlcpcb!
    const jlcpcbRotationAdjustment = getRotationBetweenPcbPin1Locations(
      supplierPin1Location,
      pcbComponent.pin1_location!,
    )
    board.add(
      <pcbnotetext
        text={`pin1: ${pcbComponent.pin1_location}`}
        pcbX={pcbX}
        pcbY={-5}
        fontSize={0.6}
      />,
    )
    board.add(
      <pcbnotetext
        text={`JLCPCB adjust: ${jlcpcbRotationAdjustment} deg`}
        pcbX={pcbX}
        pcbY={-6.5}
        fontSize={0.6}
      />,
    )
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: false,
    width: 1500,
    height: 500,
  })
})
