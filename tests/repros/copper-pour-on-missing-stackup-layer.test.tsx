import { expect, test } from "bun:test"
import { convertCircuitJsonToGerberFiles } from "circuit-json-to-gerber"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a two-layer board rejects an inner1 pour and still exports the bottom pour", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={34} height={18} layers={2} routingDisabled>
      <net name="GND" isGroundNet />
      <copperpour
        connectsTo="net.GND"
        layer="inner1"
        outline={[
          { x: -15, y: -6 },
          { x: -2, y: -6 },
          { x: -2, y: 4 },
          { x: -15, y: 4 },
        ]}
      />
      <copperpour
        connectsTo="net.GND"
        layer="bottom"
        coveredWithSolderMask
        outline={[
          { x: 2, y: -6 },
          { x: 15, y: -6 },
          { x: 15, y: 4 },
          { x: 2, y: 4 },
        ]}
      />
      <pcbnoterect
        pcbX={-8.5}
        pcbY={-1}
        width={13}
        height={10}
        color="#facc15"
        isStrokeDashed
      />
      <pcbnotetext pcbX={-8.5} pcbY={6} text="INNER1 REJECTED" fontSize={0.8} />
      <pcbnotetext
        pcbX={8.5}
        pcbY={6}
        text="BOTTOM POUR EXPORTED"
        fontSize={0.8}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  expect(circuit.db.pcb_copper_pour.list().map((pour) => pour.layer)).toEqual([
    "bottom",
  ])
  expect(circuit.db.pcb_placement_error.list()).toMatchObject([
    {
      message:
        'Copper pour for "net.GND" uses layer "inner1", which is not in the board stackup. Available layers: top, bottom.',
    },
  ])

  const gerbers = convertCircuitJsonToGerberFiles(circuitJson)
  expect(gerbers).not.toHaveProperty("In1_Cu.gbr")
  expect(gerbers["B_Cu.gbr"]).toContain("G36*")

  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
