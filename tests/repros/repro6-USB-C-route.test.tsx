import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("USB-C PCB traces not routing as intended for GND & VBUS pins", async () => {
  const { circuit } = getTestFixture()
  const pinLabels = {
    1: ["GND1", "A1"],
    2: ["GND2", "B12"],
    3: ["VBUS1", "A4"],
    4: ["VBUS2", "B9"],
    5: ["SBU2", "B8"],
    6: ["CC1", "A5"],
    7: ["DM2", "B7"],
    8: ["DP1", "A6"],
    9: ["DM1", "A7"],
    10: ["DP2", "B6"],
    11: ["SBU1", "A8"],
    12: ["CC2", "B5"],
    13: ["VBUS1", "A9"],
    14: ["VBUS2", "B4"],
    15: ["GND1", "A12"],
    16: ["GND2", "B1"],
  } as const
  circuit.add(
    <board width={50} height={50}>
      <pushbutton name="PB1" footprint={"pushbutton"} pcbX="0" pcbY="10" />

      <chip
        name="U1"
        pcbY={-10}
        pinLabels={pinLabels}
        supplierPartNumbers={{
          jlcpcb: ["C165948"],
        }}
        schPinArrangement={{
          leftSide: {
            pins: [],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [
              "VBUS1",
              "VBUS2",
              "DP1",
              "DP2",
              "DM1",
              "DM2",
              "CC1",
              "CC2",
              "SBU1",
              "SBU2",
            ],
            direction: "top-to-bottom",
          },
          bottomSide: {
            pins: ["GND1", "GND2"],
            direction: "left-to-right",
          },
        }}
        schPinStyle={{
          pin8: { topMargin: 0.4 },
          pin6: { topMargin: 0.4 },
          pin11: { topMargin: 0.2 },
          pin2: {
            rightMargin: 1,
          },
        }}
        manufacturerPartNumber="TYPE-C-31-M-12"
        footprint={
          <footprint>
            <hole
              pcbX="-2.8999180000000706mm"
              pcbY="1.180611049999925mm"
              diameter="0.7500111999999999mm"
            />
            <hole
              pcbX="2.8999180000000706mm"
              pcbY="1.180611049999925mm"
              diameter="0.7500111999999999mm"
            />
            <platedhole
              portHints={["alt_2"]}
              pcbX="4.32511199999999mm"
              pcbY="-2.7740863499999477mm"
              outerHeight="1.7999964mm"
              outerWidth="1.1999975999999999mm"
              innerHeight="1.3999972mm"
              innerWidth="0.7999983999999999mm"
              shape="pill"
            />
            <platedhole
              portHints={["alt_1"]}
              pcbX="4.32511199999999mm"
              pcbY="1.4057376499998782mm"
              outerHeight="1.9999959999999999mm"
              outerWidth="1.1999975999999999mm"
              innerHeight="1.5999968mm"
              innerWidth="0.7999983999999999mm"
              shape="pill"
            />
            <platedhole
              portHints={["alt_0"]}
              pcbX="-4.32511199999999mm"
              pcbY="1.4057376499998782mm"
              outerHeight="1.9999959999999999mm"
              outerWidth="1.1999975999999999mm"
              innerHeight="1.5999968mm"
              innerWidth="0.7999983999999999mm"
              shape="pill"
            />
            <platedhole
              portHints={["alt_3"]}
              pcbX="-4.32511199999999mm"
              pcbY="-2.7740863499999477mm"
              outerHeight="1.7999964mm"
              outerWidth="1.1999975999999999mm"
              innerHeight="1.3999972mm"
              innerWidth="0.7999983999999999mm"
              shape="pill"
            />
            <smtpad
              portHints={["B8"]}
              pcbX="-1.7500600000000759mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A5"]}
              pcbX="-1.2499339999999393mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["B7"]}
              pcbX="-0.7500619999999572mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A6"]}
              pcbX="-0.2499359999999342mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A7"]}
              pcbX="0.2499359999999342mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["B6"]}
              pcbX="0.7500619999999572mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A8"]}
              pcbX="1.2496799999998984mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["B5"]}
              pcbX="1.7500600000000759mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A1"]}
              pcbX="-3.3500060000000076mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["B12"]}
              pcbX="-3.0500319999999874mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A4"]}
              pcbX="-2.5499059999999645mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["B9"]}
              pcbX="-2.249932000000058mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["B4"]}
              pcbX="2.249932000000058mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A9"]}
              pcbX="2.5501600000000053mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["B1"]}
              pcbX="3.050032000000101mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <smtpad
              portHints={["A12"]}
              pcbX="3.3500060000000076mm"
              pcbY="2.449087049999889mm"
              width="0.29999939999999997mm"
              height="1.2999973999999999mm"
              shape="rect"
            />
            <silkscreenpath
              route={[
                { x: -4.4689776000000165, y: -1.40071475000002 },
                { x: -4.4689776000000165, y: 0.4621974499998487 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 4.471009600000116, y: -5.119096950000085 },
                { x: -4.4689776000000165, y: -5.119096950000085 },
                { x: -4.4689776000000165, y: -3.6377943500000356 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 4.471009600000116, y: -1.4010703500000545 },
                { x: 4.471009600000116, y: 0.4625530499999968 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 4.471009600000116, y: -5.119096950000085 },
                { x: 4.471009600000116, y: -3.6374387500002285 },
              ]}
            />
          </footprint>
        }
      />
      <trace from=".PB1 > .pin2" to=".U1 > .VBUS1" />
      <trace from=".PB1 > .pin1" to=".U1 > .GND2" />

      {/* if you uncomment these traces, it will route */}
      {/* <trace from=".PB1 > .pin2" to=".U1 > .GND1" /> */}
      {/* <trace from=".PB1 > .pin2" to=".U1 > .VBUS2" /> */}
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
