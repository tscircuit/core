import { expect, test } from "bun:test"
import { Am62lLinuxComputerModule } from "tests/fixtures/am62l-linux-computer-module"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("OSM-S AM62L signal, ground, and power fanout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="110mm"
      height="100mm"
      layers={4}
      defaultTraceWidth="0.15mm"
      minTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.45mm"
      autorouterVersion="beta_pipeline9"
    >
      <copperpour layer="inner1" connectsTo="net.GND" clearance="0.15mm" />
      <copperpour layer="inner2" connectsTo="net.VCC_5V" clearance="0.15mm" />
      <pcbnotetext
        text="OSM-S AM62L Linux computer module fanout"
        pcbY={48}
        fontSize="0.8mm"
        anchorAlignment="center"
      />
      <Am62lLinuxComputerModule />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()[0]?.message).toContain(
    "only 95 of 96 connections could escape",
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
