import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["GND1"],
  pin2: ["GND2"],
  pin3: ["FB"],
  pin4: ["VDD"],
  pin5: ["HVIN"],
  pin6: ["NC"],
  pin8: ["DRAIN"],
} as const

test("repro146 pinNumber 7 is not present but still showed in schematic chip order", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="UCC28881DR"
        pinLabels={pinLabels}
        supplierPartNumbers={{
          jlcpcb: ["C544970"],
        }}
        manufacturerPartNumber="UCC28881DR"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-1.905mm"
              pcbY="-2.77241mm"
              width="0.58801mm"
              height="2.0450048mm"
              radius="0.294005mm"
              shape="pill"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="-0.635mm"
              pcbY="-2.77241mm"
              width="0.58801mm"
              height="2.0450048mm"
              radius="0.294005mm"
              shape="pill"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="0.635mm"
              pcbY="-2.77241mm"
              width="0.58801mm"
              height="2.0450048mm"
              radius="0.294005mm"
              shape="pill"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX="1.905mm"
              pcbY="-2.77241mm"
              width="0.58801mm"
              height="2.0450048mm"
              radius="0.294005mm"
              shape="pill"
            />
            <smtpad
              portHints={["pin8"]}
              pcbX="-1.905mm"
              pcbY="2.77241mm"
              width="0.58801mm"
              height="2.0450048mm"
              radius="0.294005mm"
              shape="pill"
            />
            <smtpad
              portHints={["pin6"]}
              pcbX="0.635mm"
              pcbY="2.77241mm"
              width="0.58801mm"
              height="2.0450048mm"
              radius="0.294005mm"
              shape="pill"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX="1.905mm"
              pcbY="2.77241mm"
              width="0.58801mm"
              height="2.0450048mm"
              radius="0.294005mm"
              shape="pill"
            />
            <silkscreenpath
              route={[
                { x: -2.449982400000067, y: -0.47571659999994154 },
                { x: -2.449982400000067, y: -1.5999967999999853 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: -2.449982400000067, y: 0.4649977999999919 },
                { x: -2.449982400000067, y: 1.5899891999999909 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 2.459989999999948, y: 1.5999967999999853 },
                { x: 2.459989999999948, y: -1.5999967999999853 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: -2.449982400000067, y: -1.5999967999999853 },
                { x: 2.459989999999948, y: -1.5999967999999853 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: -2.449982400000067, y: 1.5999967999999853 },
                { x: 2.459989999999948, y: 1.5999967999999853 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: -1.799844000000121, y: -1.089913999999908 },
                { x: -1.804959010512448, y: -1.1287663621366164 },
                { x: -1.8199554625364271, y: -1.1649710000000368 },
                { x: -1.8438113726490428, y: -1.1960606273510166 },
                { x: -1.874900999999909, y: -1.2199165374636323 },
                { x: -1.9111056378635567, y: -1.2349129894874977 },
                { x: -1.9499580000000378, y: -1.240028000000052 },
                { x: -1.9888103621367463, y: -1.2349129894874977 },
                { x: -2.0250150000001668, y: -1.2199165374636323 },
                { x: -2.0561046273511465, y: -1.1960606273510166 },
                { x: -2.079960537463762, y: -1.1649710000000368 },
                { x: -2.0949569894876277, y: -1.1287663621366164 },
                { x: -2.1000719999999546, y: -1.089913999999908 },
                { x: -2.0949569894876277, y: -1.0510616378635405 },
                { x: -2.079960537463762, y: -1.0148570000000063 },
                { x: -2.0561046273511465, y: -0.9837673726489129 },
                { x: -2.0250150000001668, y: -0.9599114625362972 },
                { x: -1.9888103621367463, y: -0.9449150105125455 },
                { x: -1.9499580000000378, y: -0.9398000000001048 },
                { x: -1.9111056378635567, y: -0.9449150105125455 },
                { x: -1.874900999999909, y: -0.9599114625362972 },
                { x: -1.8438113726490428, y: -0.9837673726489129 },
                { x: -1.8199554625364271, y: -1.0148570000000063 },
                { x: -1.804959010512448, y: -1.0510616378635405 },
                { x: -1.799844000000121, y: -1.089913999999908 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: -2.449982400000067, y: -0.47571659999994154 },
                { x: -2.6851610612492323, y: -0.412700732358644 },
                { x: -2.857323804817497, y: -0.24053804183404282 },
                { x: -2.9203397449175554, y: -0.005359399999974812 },
                { x: -2.857323804817497, y: 0.2298192418340932 },
                { x: -2.6851610612492323, y: 0.4019819323588081 },
                { x: -2.449982400000067, y: 0.4649977999999919 },
              ]}
            />
            <silkscreentext
              text="{NAME}"
              pcbX="-0.0254mm"
              pcbY="4.5052mm"
              anchorAlignment="center"
              fontSize="1mm"
            />
            <courtyardoutline
              outline={[
                { x: -2.7391999999999825, y: 3.7552000000001726 },
                { x: 2.6884000000000015, y: 3.7552000000001726 },
                { x: 2.6884000000000015, y: -3.80600000000004 },
                { x: -2.7391999999999825, y: -3.80600000000004 },
                { x: -2.7391999999999825, y: 3.7552000000001726 },
              ]}
            />
          </footprint>
        }
        cadModel={{
          objUrl:
            "https://modelcdn.tscircuit.com/easyeda_models/assets/C544970.obj?uuid=af2c16e040214668b20d16a78980992a",
          stepUrl:
            "https://modelcdn.tscircuit.com/easyeda_models/assets/C544970.step?uuid=af2c16e040214668b20d16a78980992a",
          pcbRotationOffset: 0,
          modelOriginPosition: { x: -0.000012700000070253736, y: 0, z: -0.95 },
        }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
