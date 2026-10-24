import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Pad geometry from KiCad's Package_TO_SOT_THT/TO-92_HandSolder: 1.1x1.8mm
// pads with 0.75mm drills offset 0.4mm toward alternating pad ends
const To92HandSolderFootprint = () => (
  <footprint>
    <platedhole
      portHints={["1"]}
      shape="circular_hole_with_rect_pad"
      holeDiameter="0.75mm"
      rectPadWidth="1.1mm"
      rectPadHeight="1.8mm"
      holeOffsetY="-0.4mm"
      pcbX={-1.27}
      pcbY={0}
    />
    <platedhole
      portHints={["2"]}
      shape="circular_hole_with_rect_pad"
      holeDiameter="0.75mm"
      rectPadWidth="1.1mm"
      rectPadHeight="1.8mm"
      holeOffsetY="0.4mm"
      pcbX={0}
      pcbY={1.27}
    />
    <platedhole
      portHints={["3"]}
      shape="circular_hole_with_rect_pad"
      holeDiameter="0.75mm"
      rectPadWidth="1.1mm"
      rectPadHeight="1.8mm"
      holeOffsetY="-0.4mm"
      pcbX={1.27}
      pcbY={0}
    />
  </footprint>
)

test("repro: plated hole offsets ignore component rotation and layer flip", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="28mm" height="10mm" routingDisabled>
      <chip
        name="Q1"
        footprint={<To92HandSolderFootprint />}
        pcbX={-9}
        pcbY={0.5}
      />
      <chip
        name="Q2"
        footprint={<To92HandSolderFootprint />}
        pcbX={-3}
        pcbY={0.5}
        pcbRotation={90}
      />
      <chip
        name="Q3"
        footprint={<To92HandSolderFootprint />}
        pcbX={3}
        pcbY={0.5}
        pcbRotation={180}
      />
      <chip
        name="Q4"
        footprint={<To92HandSolderFootprint />}
        pcbX={9}
        pcbY={0.5}
        pcbRotation={90}
        layer="bottom"
      />
      <pcbnotetext text="top 0°" pcbX={-9} pcbY={-3.5} fontSize={0.7} />
      <pcbnotetext text="top 90°" pcbX={-3} pcbY={-3.5} fontSize={0.7} />
      <pcbnotetext text="top 180°" pcbX={3} pcbY={-3.5} fontSize={0.7} />
      <pcbnotetext text="bottom 90°" pcbX={9} pcbY={-3.5} fontSize={0.7} />
    </board>,
  )
  circuit.render()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
