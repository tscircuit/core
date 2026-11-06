import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dogbone fanout routes when escaped nets also have copper pours", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={20}
      layers={6}
      routeRemaining={false}
      minTraceWidth={0.1}
      minViaPadDiameter={0.4}
      minViaHoleDiameter={0.15}
    >
      <copperpour layer="inner1" connectsTo="net.GND" />
      <copperpour layer="inner3" connectsTo="net.VCC" />
      <fanout autorouter="dogbone" fanoutRoutingLayers={["inner2"]}>
        <chip
          name="U1"
          footprint="bga256_grid16x16_p0.8mm_pad0.36mm_blorigin_pinnumbering(columnmajor)"
          connections={{
            pin1: "net.DATA0",
            pin6: "net.DATA1",
            pin8: "net.VCC",
            pin15: "net.GND",
            pin22: "net.CLOCK",
            pin29: "net.ENABLE",
            pin31: "net.DATA2",
            pin36: "net.DATA3",
          }}
        />
      </fanout>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_via.list()).toHaveLength(8)
  expect(circuit.db.pcb_trace.list()).toHaveLength(8)
})
