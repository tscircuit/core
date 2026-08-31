import { expect, test } from "bun:test"
import {
  Am62lOsmSizeS,
  HxTactileSwitch,
  Sii9022AcnuReset,
} from "tests/fixtures/am62l-osm-control-fanout-components"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("AM62L OSM control fanout with switches and HDMI reset", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="170mm"
      height="90mm"
      layers={4}
      autorouterVersion="beta_pipeline9"
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.45mm"
    >
      <breakout
        name="OSM_REGION"
        width="66mm"
        height="66mm"
        autorouter="fanout"
        fanoutRoutingLayers={["top", "bottom"]}
        busFanoutDirections={{ OSM_CONTROL: "leftside_center" }}
      >
        <bus
          name="OSM_CONTROL"
          connections={[
            "MODULE_RESET_IN",
            "MODULE_FORCE_RECOVERY",
            "HDMI_RESET",
          ]}
          preferredLayer="top"
          preferredLayers={["bottom"]}
        />
        <Am62lOsmSizeS name="U1" pcbRotation={180} />
        <breakoutpoint connection=".U1 > .RESET_IN_N" pcbX={-32} pcbY={12} />
        <breakoutpoint
          connection=".U1 > .FORCE_RECOVERY_N"
          pcbX={-32}
          pcbY={10}
        />
        <breakoutpoint connection=".U1 > .RESET_OUT_N" pcbX={-32} pcbY={8} />
      </breakout>

      <HxTactileSwitch name="SW1" pcbX={-30} pcbY={36.5} />
      <HxTactileSwitch name="SW2" pcbX={-22} pcbY={40} />
      <Sii9022AcnuReset name="U5" pcbX={74} pcbY={10} pcbRotation={180} />

      <trace
        name="MODULE_RESET_IN"
        from=".U1 > .RESET_IN_N"
        to=".SW1 > .pin1"
      />
      <trace
        name="MODULE_FORCE_RECOVERY"
        from=".U1 > .FORCE_RECOVERY_N"
        to=".SW2 > .pin1"
      />
      <trace name="HDMI_RESET" from=".U1 > .RESET_OUT_N" to=".U5 > .RESET" />

      <pcbnotetext
        text="AM62L OSM CONTROL: switches left, SiI9022 reset right"
        pcbY={43}
        fontSize="1.2mm"
        anchorAlignment="center"
      />
      <pcbnotetext
        text="SW1 RESET"
        pcbX={-30}
        pcbY={34}
        fontSize="0.8mm"
        anchorAlignment="center"
      />
      <pcbnotetext
        text="SW2 RECOVERY"
        pcbX={-22}
        pcbY={37.5}
        fontSize="0.8mm"
        anchorAlignment="center"
      />
      <pcbnotetext
        text="U5 SII9022ACNU RESET"
        pcbX={74}
        pcbY={2.5}
        fontSize="0.8mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
