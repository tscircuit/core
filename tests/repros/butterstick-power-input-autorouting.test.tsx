import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Native ButterStick r1.0 power input, including all C165/U18 pads and their layers.
// https://github.com/butterstick-fpga/butterstick-hardware/blob/0694ddfa9824a07f0c6c6981186e45f80187659c/hardware/ButterStick_r1.0/ButterStick.kicad_pcb
// Pad points are footprint-local, in mm, X right/Y up. originalLayer keeps
// the native bottom-side geometry from receiving an additional mirror.
test("ButterStick power input annulus contact blocks autorouting", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={80}
      height={49}
      layers={8}
      schematicDisabled
      minTraceWidth={0.089}
      minTraceToPadEdgeClearance={0.0889}
      minViaEdgeToPadEdgeClearance={0.0889}
      minPadEdgeToPadEdgeClearance={0.0889}
      minViaPadDiameter={0.4}
      minViaHoleDiameter={0.2}
      autorouter={{ local: true, serverCacheEnabled: false }}
    >
      <chip
        name="C165"
        manufacturerPartNumber="150uF"
        pcbX={17.3}
        pcbY={-4.7}
        layer="top"
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        footprint={
          <footprint originalLayer="top">
            <smtpad
              name="pad0"
              portHints={["pin1"]}
              pcbX={2.2}
              pcbY={0}
              layer="top"
              shape="rotated_rect"
              width={3}
              height={1.6}
              ccwRotation={180}
              cornerRadius={0.25}
            />
            <smtpad
              name="pad1"
              portHints={["pin2"]}
              pcbX={-2.2}
              pcbY={0}
              layer="top"
              shape="rotated_rect"
              width={3}
              height={1.6}
              ccwRotation={180}
              cornerRadius={0.25}
            />
          </footprint>
        }
      />
      <chip
        name="U18"
        manufacturerPartNumber="TPS2121"
        pcbX={17.95}
        pcbY={-6.05}
        layer="bottom"
        pinLabels={{
          pin1: ["NATIVE_1"],
          pin2: ["NATIVE_2"],
          pin3: ["NATIVE_3"],
          pin4: ["NATIVE_4"],
          pin5: ["NATIVE_5"],
          pin6: ["NATIVE_6"],
          pin7: ["NATIVE_7"],
          pin8: ["NATIVE_8"],
          pin9: ["NATIVE_9"],
          pin10: ["NATIVE_10"],
          pin11: ["NATIVE_11"],
          pin12: ["NATIVE_12"],
        }}
        footprint={
          <footprint originalLayer="bottom">
            <smtpad
              name="pad0"
              portHints={["pin1"]}
              pcbX={0.35}
              pcbY={-0.675}
              layer="bottom"
              shape="rotated_rect"
              width={1.05}
              height={0.4}
              ccwRotation={90}
              cornerRadius={0.05}
            />
            <platedhole
              name="pad1"
              portHints={["pin1"]}
              pcbX={0.35}
              pcbY={-0.4}
              shape="circle"
              outerDiameter={0.4}
              holeDiameter={0.2}
            />
            <platedhole
              name="pad2"
              portHints={["pin2"]}
              pcbX={-0.35}
              pcbY={-0.4}
              shape="circle"
              outerDiameter={0.4}
              holeDiameter={0.2}
            />
            <smtpad
              name="pad3"
              portHints={["pin2"]}
              pcbX={-0.35}
              pcbY={-0.675}
              layer="bottom"
              shape="rotated_rect"
              width={1.05}
              height={0.4}
              ccwRotation={90}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad4"
              portHints={["pin3"]}
              pcbX={-1.15}
              pcbY={-0.75}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad5"
              portHints={["pin4"]}
              pcbX={-1.15}
              pcbY={-0.25}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad6"
              portHints={["pin5"]}
              pcbX={-1.15}
              pcbY={0.25}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad7"
              portHints={["pin6"]}
              pcbX={-1.15}
              pcbY={0.75}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad8"
              portHints={["pin7"]}
              pcbX={-0.35}
              pcbY={0.675}
              layer="bottom"
              shape="rotated_rect"
              width={1.05}
              height={0.4}
              ccwRotation={90}
              cornerRadius={0.05}
            />
            <platedhole
              name="pad9"
              portHints={["pin7"]}
              pcbX={-0.35}
              pcbY={0.4}
              shape="circle"
              outerDiameter={0.4}
              holeDiameter={0.2}
            />
            <smtpad
              name="pad10"
              portHints={["pin8"]}
              pcbX={0.35}
              pcbY={0.675}
              layer="bottom"
              shape="rotated_rect"
              width={1.05}
              height={0.4}
              ccwRotation={90}
              cornerRadius={0.05}
            />
            <platedhole
              name="pad11"
              portHints={["pin8"]}
              pcbX={0.35}
              pcbY={0.4}
              shape="circle"
              outerDiameter={0.4}
              holeDiameter={0.2}
            />
            <smtpad
              name="pad12"
              portHints={["pin9"]}
              pcbX={1.15}
              pcbY={0.75}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad13"
              portHints={["pin10"]}
              pcbX={1.15}
              pcbY={0.25}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad14"
              portHints={["pin11"]}
              pcbX={1.15}
              pcbY={-0.25}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
            <smtpad
              name="pad15"
              portHints={["pin12"]}
              pcbX={1.15}
              pcbY={-0.75}
              layer="bottom"
              shape="rotated_rect"
              width={0.6}
              height={0.2}
              ccwRotation={0}
              cornerRadius={0.05}
            />
          </footprint>
        }
      />
      <net
        name="V5"
        connectsTo={[".C165 > .pin1", ".U18 > .pin1", ".U18 > .pin8"]}
      />
      <net
        name="GND"
        connectsTo={[
          ".C165 > .pin2",
          ".U18 > .pin3",
          ".U18 > .pin6",
          ".U18 > .pin9",
          ".U18 > .pin12",
        ]}
      />
      <pcbnotetext
        pcbX={17.75}
        pcbY={-2}
        fontSize={0.4}
        text="C165 150uF / U18 TPS2121"
      />
      <pcbnotetext
        pcbX={15.1}
        pcbY={-3}
        fontSize={0.25}
        text="C165.2 GND (top)"
      />
      <pcbnotetext
        pcbX={19.5}
        pcbY={-3}
        fontSize={0.25}
        text="C165.1 5V (top)"
      />
      <pcbnotetext pcbX={17.95} pcbY={-8} fontSize={0.3} text="U18 (bottom)" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_footprint_overlap_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    colorOverrides: {
      substrate: "#ffffff",
      copper: { top: "#dc2626", bottom: "#2563eb" },
    },
    width: 1000,
    height: 800,
    viewport: { minX: 12.5, maxX: 23, minY: -9, maxY: -1 },
    shouldDrawErrors: true,
    showErrorsInTextOverlay: false,
    shouldDrawRatsNest: false,
    includeVersion: false,
  })
})
