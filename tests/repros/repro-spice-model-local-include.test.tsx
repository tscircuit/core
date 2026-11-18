import { expect, test } from "bun:test"
import { createIsolatedNgspiceEngine } from "tests/fixtures/create-isolated-ngspice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a SPICE model uses its project-relative include", async () => {
  const { circuit, staticAssetsServerUrl } = getTestFixture({
    withStaticAssetsServer: true,
  })
  circuit.pcbDisabled = true
  circuit.setPlatform({
    projectBaseUrl: staticAssetsServerUrl,
    spiceEngineMap: {
      ngspice: createIsolatedNgspiceEngine(),
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
      <analogsimulation duration="1ms" spiceEngine="ngspice" />
    </board>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
  })
}, 15_000)
