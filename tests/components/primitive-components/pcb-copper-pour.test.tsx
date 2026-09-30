import { expect, test } from "bun:test"
import type { PcbCopperPour } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbcopperpour inserts precomputed copper geometry", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm" layers={4}>
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
              sourceNetId="source_net_top_rect"
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
              sourceNetId="source_net_rect"
              pcbX={0}
              pcbY={7}
              width={3}
              height={2}
              pcbRotation="30deg"
              coveredWithSolderMask={false}
            />
            <pcbcopperpour
              shape="polygon"
              layer="top"
              sourceNetId="source_net_polygon"
              points={[
                { x: -2, y: 1 },
                { x: 0, y: 4 },
                { x: 2, y: 1 },
              ]}
            />
            <pcbcopperpour
              shape="brep"
              layer="top"
              sourceNetId="source_net_brep"
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

  const pcbCopperPours = circuit
    .getCircuitJson()
    .filter(
      (element): element is PcbCopperPour => element.type === "pcb_copper_pour",
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
    "bottom",
    "bottom",
  ])
  expect(
    pcbCopperPours.map((pcbCopperPour) => pcbCopperPour.source_net_id),
  ).toEqual([
    "source_net_top_rect",
    "source_net_rect",
    "source_net_polygon",
    "source_net_brep",
  ])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
