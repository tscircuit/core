import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ground pour cleanup handles a rotated pill hole with a rectangular pad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm" routingDisabled>
      <net name="GND" isGroundNet />
      <connector
        name="J2"
        pcbRotation={90}
        pinLabels={{ pin1: "GND", pin2: "TX", pin3: "RX" }}
        connections={{ pin1: "net.GND" }}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin3"]}
              pcbX="2.5337008mm"
              outerDiameter="1.5999968mm"
              holeDiameter="1.1000232mm"
              shape="circle"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="-0.0062992mm"
              outerDiameter="1.5999968mm"
              holeDiameter="1.1000232mm"
              shape="circle"
            />
            <platedhole
              portHints={["pin1"]}
              pcbX="-2.5462992mm"
              holeWidth="1.1000232mm"
              holeHeight="1.1000232mm"
              rectPadWidth="1.5748mm"
              rectPadHeight="1.5999968mm"
              shape="pill_hole_with_rect_pad"
            />
          </footprint>
        }
      />
      <copperpour connectsTo="net.GND" layer="inner1" />
      <pcbnotetext
        text="ROTATED J2 PIN 1 CONNECTS TO INNER GND POUR"
        pcbY={4}
        fontSize={0.45}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.pcb_plated_hole
      .list()
      .find((hole) => hole.shape === "rotated_pill_hole_with_rect_pad"),
  ).toMatchObject({
    shape: "rotated_pill_hole_with_rect_pad",
    hole_offset_x: undefined,
    hole_offset_y: undefined,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "inner1",
  })
})
