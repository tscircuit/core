import { expect, test } from "bun:test"
import type { PcbCopperPour, SourceNet } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbcopperpour inserts precomputed copper geometry", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm" layers={4}>
      <net name="TOP_RECT" />
      <net name="RECT" />
      <net name="POLYGON" />
      <net name="BREP" />
      <pcbnotetext
        pcbX={0}
        pcbY={5.5}
        text="PRECOMPUTED COPPER: RECT / POLYGON / BREP"
        fontSize={0.7}
      />
      <chip
        name="TOP_RECT"
        pcbX={-7}
        pcbY={-4}
        pcbRotation="20deg"
        noSchematicRepresentation
        footprint={
          <footprint>
            <pcbcopperpour
              shape="rect"
              layer="top"
              connectsTo="net.TOP_RECT"
              pcbX={1}
              pcbY={0}
              width={3}
              height={2}
              pcbRotation="10deg"
            />
          </footprint>
        }
      />
      <chip
        name="COPPER"
        layer="bottom"
        pcbX={0}
        pcbY={0}
        pcbRotation="90deg"
        noSchematicRepresentation
        footprint={
          <footprint>
            <pcbcopperpour
              shape="rect"
              layer="top"
              connectsTo="net.RECT"
              pcbX={0}
              pcbY={7}
              width={3}
              height={2}
              pcbRotation="30deg"
              coveredWithSolderMask={false}
            />
            <pcbcopperpour
              shape="polygon"
              layer="inner1"
              connectsTo="net.POLYGON"
              pcbX={1}
              pcbY={-1}
              pcbRotation="45deg"
              points={[
                { x: -2, y: 1 },
                { x: 0, y: 4 },
                { x: 2, y: 1 },
              ]}
            />
            <pcbcopperpour
              shape="brep"
              layer="top"
              connectsTo="net.BREP"
              pcbX={-1}
              pcbY={1}
              pcbRotation="15deg"
              brepShape={{
                outer_ring: {
                  vertices: [
                    { x: -2, y: -5 },
                    { x: -2, y: -1 },
                    { x: 2, y: -1 },
                    { x: 2, y: -5 },
                  ],
                },
                inner_rings: [
                  {
                    vertices: [
                      { x: -0.8, y: -3.8 },
                      { x: 0.8, y: -3.8 },
                      { x: 0.8, y: -2.2 },
                      { x: -0.8, y: -2.2 },
                    ],
                  },
                ],
              }}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbCopperPours = circuitJson.filter(
    (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
  )
  const sourceNets = circuitJson.filter(
    (element): element is SourceNet => element.type === "source_net",
  )
  expect(pcbCopperPours).toHaveLength(4)
  expect(pcbCopperPours.map((pcbCopperPour) => pcbCopperPour.shape)).toEqual([
    "rect",
    "polygon",
    "polygon",
    "brep",
  ])
  expect(pcbCopperPours.map((pcbCopperPour) => pcbCopperPour.layer)).toEqual([
    "top",
    "bottom",
    "inner1",
    "bottom",
  ])
  expect(
    pcbCopperPours.map((pcbCopperPour) => pcbCopperPour.source_net_id),
  ).toEqual([
    sourceNets.find((sourceNet) => sourceNet.name === "TOP_RECT")
      ?.source_net_id,
    sourceNets.find((sourceNet) => sourceNet.name === "RECT")?.source_net_id,
    sourceNets.find((sourceNet) => sourceNet.name === "POLYGON")?.source_net_id,
    sourceNets.find((sourceNet) => sourceNet.name === "BREP")?.source_net_id,
  ])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
