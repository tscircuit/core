import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("example 4: kicad theme demo", async () => {
  const { project, logSoup } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        schX={-2}
      />

      <capacitor capacitance={"10uF"} name="C1" footprint="0402" pcbX={2} schX={2} />
      <trace from=".R1 > .pin2" to=".C1 > .anode" />

      <chip
        name="U2"
        manufacturerPartNumber="ATmega8-16A"
        schX={7}
        schWidth={3}
        schHeight={7}
        pinLabels={{
            pin7: "GND",
            pin8: "-V+"
        }}
        schPinStyle={{
          pin29: { bottomMargin: 0.5 },
        }}
        schPortArrangement={{
          leftSide: {
            pins: [29, 7, 8, 20, 19, 22],
            direction: "top-to-bottom",
          },
          topSide: {
            direction: "left-to-right",
            pins: [4, 18],
          },
          rightSide: {
            direction: "bottom-to-top",
            pins: [12, 13, 14, 15, 16, 17, 23],
          },
        }}
      />
    </board>,
  )
  const fs = require('node:fs');
  const circuitJson = project.getCircuitJson();
  fs.writeFileSync('circuit.json', JSON.stringify(circuitJson, null, 2)); 

  project.render()

  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
