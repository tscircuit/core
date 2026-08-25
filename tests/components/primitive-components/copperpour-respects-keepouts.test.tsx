import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("top copper pour is clipped around top-layer keepouts", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="16mm" routingDisabled>
      <pcbnotetext
        text="TOP POUR: RECT + CIRCLE VOIDS; BOTTOM-ONLY AREA STAYS FILLED"
        pcbX={-11}
        pcbY={7}
        fontSize={0.45}
        anchorAlignment="top_left"
      />
      <keepout
        shape="rect"
        width="4mm"
        height="7mm"
        pcbX={-6}
        pcbY={0}
        layers={["top"]}
      />
      <keepout
        shape="circle"
        radius="2.5mm"
        pcbX={0}
        pcbY={0}
        layers={["top"]}
      />
      <keepout
        shape="circle"
        radius="2.5mm"
        pcbX={7}
        pcbY={0}
        layers={["bottom"]}
      />
      <silkscreencircle pcbX={7} pcbY={0} radius="2.5mm" layer="top" />
      <silkscreentext
        text="BOTTOM K/O: TOP FILLED"
        pcbX={7}
        pcbY={3.2}
        fontSize="0.35mm"
      />
      <copperpour name="TOP_GND" connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const [topCopperPour] = circuit.db.pcb_copper_pour.list()
  expect(topCopperPour?.shape).toBe("brep")
  if (topCopperPour?.shape !== "brep") {
    throw new Error("Expected the top copper pour to use BRep geometry")
  }
  expect(topCopperPour.brep_shape.inner_rings).toHaveLength(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, { layer: "top" })
})
