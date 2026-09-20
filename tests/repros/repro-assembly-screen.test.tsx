import { expect, test } from "bun:test"
import { assembly } from "lib/namespaced-elements"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly.screen attaches an OLED to a PCB connector", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <assembly.device name="display-module">
      <board name="B1" width="44mm" height="36mm" routingDisabled>
        <connector
          name="J1"
          pcbY={-13}
          pinCount={30}
          footprint="fpc30_p0.5mm_pw0.3mm_pl1.25mm_mpx17.58mm_mpy2.325mm_mpw2mm_mpl3mm_mounttop"
        />
      </board>
      <assembly.screen
        name="SCREEN"
        connectsTo=".B1 .J1"
        cadModel="flexscreen_w26.7mm_h19.26mm_flex12mm_flexwidth15.5mm_conductors30_conductorpitch0.5mm_conductorwidth0.3mm_edgemargin0.35mm_sitsflat"
      />
    </assembly.device>,
  )

  await circuit.renderUntilSettled()

  const screen = circuit.db.source_component
    .list()
    .find((component) => component.name === "SCREEN")
  expect(screen).toBeDefined()
  expect(
    circuit.db.cad_component
      .list()
      .find(
        (component) =>
          component.source_component_id === screen?.source_component_id,
      )?.footprinter_string,
  ).toStartWith("flexscreen_")

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [45, 38, 55],
    poppygl: {
      lookAt: [0, 0, 0],
      backgroundColor: [1, 1, 1],
      grid: false,
    },
  })
})
