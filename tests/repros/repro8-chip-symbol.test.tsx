import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro7-rotated-rect-obstacle", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <trace from=".SW1 > .pin1" to=".R2 > .pin2" />
      <trace from=".SW1 > .pin2" to=".R1 > .pin2" />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schY={-1}
        schX={1.5}
      />
      <resistor name="R2" resistance="10k" footprint="0402" schX={-1} />
      <chip
        schX={3}
        name="SW1"
        pinLabels={{
          pin1: "OUT1",
          pin2: "OUT2",
        }}
        symbolName="push_button_normally_open_momentary_horz"
        cadModel={{
          objUrl:
            "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=6ef04b62f1e945518af209609f65fa6f&pn=C110153",
          rotationOffset: { x: 0, y: 0, z: 0 },
          positionOffset: { x: 0, y: 0, z: 3.1 },
        }}
        supplierPartNumbers={{
          jlcpcb: ["C110153"],
        }}
        footprint={
          <footprint>
            <platedhole
              portHints={["4"]}
              pcbX="3.2499299999998357mm"
              pcbY="-2.249932000000058mm"
              outerDiameter="1.9999959999999999mm"
              holeDiameter="1.3000228mm"
              shape="circle"
            />
            <platedhole
              portHints={["2"]}
              pcbX="3.2499299999998357mm"
              pcbY="2.249932000000058mm"
              outerDiameter="1.9999959999999999mm"
              holeDiameter="1.3000228mm"
              shape="circle"
            />
            <platedhole
              portHints={["1"]}
              pcbX="-3.2499299999999494mm"
              pcbY="2.249932000000058mm"
              outerDiameter="1.9999959999999999mm"
              holeDiameter="1.3000228mm"
              shape="circle"
            />
            <platedhole
              portHints={["3"]}
              pcbX="-3.2499299999999494mm"
              pcbY="-2.249932000000058mm"
              outerDiameter="1.9999959999999999mm"
              holeDiameter="1.3000228mm"
              shape="circle"
            />
            <silkscreenpath
              route={[
                { x: -2.2743160000001126, y: -2.999994000000015 },
                { x: 2.274315999999999, y: -2.999994000000015 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: -2.999994000000129, y: 1.0999978000000965 },
                { x: -2.999994000000129, y: -0.999998000000005 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 3.0999937999998792, y: 1.0279888000000028 },
                { x: 3.0999937999998792, y: -1.0999977999999828 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: -1.99999600000001, y: 2.999994000000015 },
                { x: 2.274315999999999, y: 2.999994000000015 },
              ]}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
