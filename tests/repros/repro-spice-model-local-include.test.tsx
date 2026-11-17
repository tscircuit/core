import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a SPICE model bundles its project-relative include before simulation", async () => {
  let simulatedSpice = ""
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })
  circuit.pcbDisabled = true
  circuit.setPlatform({
    projectBaseUrl: staticAssetsServerUrl,
    spiceEngineMap: {
      inspect: {
        simulate: async (spiceString) => {
          simulatedSpice = spiceString
          return { simulationResultCircuitJson: [] }
        },
      },
    },
  })
  circuit.add(
    <board routingDisabled>
      <voltagesource
        name="V1"
        voltage="5V"
        schX={-5}
        connections={{ pin1: "net.IN", pin2: "net.GND" }}
      />
      <chip
        name="U1"
        displayName="OUT = 0.4 x IN"
        schX={2}
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "GND" }}
        schPinArrangement={{
          leftSide: ["IN"],
          rightSide: ["OUT"],
          bottomSide: ["GND"],
        }}
        connections={{ IN: "net.IN", OUT: "net.OUT", GND: "net.GND" }}
        spiceModel={
          <spicemodel
            source={`.subckt DIVIDER IN OUT GND
X1 IN OUT GND GAIN_STAGE
.ends DIVIDER
.include "./models/divider.lib"`}
          />
        }
      />
      <voltageprobe name="OUT" connectsTo="net.OUT" />
      <analogsimulation duration="1ms" spiceEngine="inspect" />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(simulatedSpice).toContain(".subckt GAIN_STAGE IN OUT GND")
  expect(simulatedSpice).not.toContain(".include")
})
