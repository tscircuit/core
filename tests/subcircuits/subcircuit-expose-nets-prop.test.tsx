import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit exposeNets connects child nets to parent nets", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="5mm" autorouter="sequential-trace">
      <net name="GND" />
      <pinheader
        name="J1"
        pinCount={1}
        footprint="pinrow1"
        pinLabels={{ pin1: "net_GND" }}
        pcbX={-3}
        pcbY={0}
        connections={{ pin1: "net.GND" }}
      />
      <subcircuit name="S1" exposeNets pcbX={3} pcbY={0}>
        <pinheader
          name="J2"
          pinCount={1}
          footprint="pinrow1"
          pinLabels={{ pin1: "net_GND" }}
          pcbX={0}
          pcbY={0}
          connections={{ pin1: "net.GND" }}
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
