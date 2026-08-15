import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["VSS"],
  pin2: ["VOUT"],
  pin3: ["VIN"],
} as const

test("C2891263 CAD model rotation should match its footprint on the bottom layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        layer="bottom"
        pinLabels={pinLabels}
        supplierPartNumbers={{ jlcpcb: ["C2891263"] }}
        manufacturerPartNumber="XC6206P282MR-G"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="1.235075mm"
              pcbY="-0.94996mm"
              width="1.0700004mm"
              height="0.5999988mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="1.235075mm"
              pcbY="0.94996mm"
              width="1.0700004mm"
              height="0.5999988mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="-1.235075mm"
              pcbY="0mm"
              width="1.0700004mm"
              height="0.5999988mm"
              shape="rect"
            />
            <silkscreenpath
              route={[
                { x: 0.8760714, y: 1.536192 },
                { x: -0.8763254, y: 1.536192 },
                { x: -0.8763254, y: 0.4945888 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 0.8760714, y: -1.536192 },
                { x: -0.8763254, y: -1.536192 },
                { x: -0.8763254, y: -0.4945888 },
              ]}
            />
            <silkscreenpath
              route={[
                { x: 0.8760714, y: 0.4553966 },
                { x: 0.8760714, y: -0.4553966 },
              ]}
            />
            <silkscreentext
              text="{NAME}"
              pcbX="-0.012827mm"
              pcbY="2.524mm"
              anchorAlignment="center"
              fontSize="1mm"
            />
          </footprint>
        }
        cadModel={{
          objUrl:
            "https://modelcdn.tscircuit.com/easyeda_models/assets/C2891263.obj?uuid=cefd4596db214da394d9632b2b88f8f2",
          stepUrl:
            "https://modelcdn.tscircuit.com/easyeda_models/assets/C2891263.step?uuid=cefd4596db214da394d9632b2b88f8f2",
          pcbRotationOffset: 90,
          modelOriginPosition: { x: 0.0000127, y: 0, z: 0 },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    camPos: [0, -20, 0.01],
    poppygl: {
      backgroundColor: [1, 1, 1],
      grid: false,
      fov: 30,
    },
  })
})
