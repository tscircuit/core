import { expect, test } from "bun:test"
import { convertCircuitJsonToGerberFiles } from "circuit-json-to-gerber"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a two-layer board accepts a pour on inner1 but omits it from Gerbers", async () => {
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
      <pcbnotetext
        pcbX={-8.5}
        pcbY={6}
        text="INNER1 POUR MISSING"
        fontSize={0.8}
      />
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
    "inner1",
    "bottom",
  ])
  expect(
    circuitJson.filter((record) => record.type.endsWith("_error")),
  ).toEqual([])

  const gerbers = convertCircuitJsonToGerberFiles(circuitJson)
  expect(gerbers).not.toHaveProperty("In1_Cu.gbr")
  expect(gerbers["B_Cu.gbr"]).toContain("G36*")

  // The two-layer export has no copper file for the inner1 geometry.
  const exportedLayout = circuitJson.filter(
    (record) =>
      record.type !== "pcb_copper_pour" ||
      record.layer !== "inner1" ||
      "In1_Cu.gbr" in gerbers,
  )
  await expect(exportedLayout).toMatchPcbSnapshot(import.meta.path)
})
