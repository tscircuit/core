import { expect, test } from "bun:test"
import { assembly } from "lib"
import {
  ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
  ER_OLED096_1_3W_CONTACT_COUNT,
  ER_OLED096_1_3W_FLEXSCREEN_MODEL,
  ER_OLED096_1_3W_SCREEN_HEIGHT,
  ER_OLED096_1_3W_SCREEN_WIDTH,
} from "tests/assembly/fixtures/er-oled096-1-3w"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Connector = () => (
  <connector
    name="J1"
    pinCount={ER_OLED096_1_3W_CONTACT_COUNT}
    footprint={ER_OLED096_1_3W_CONNECTOR_FOOTPRINT}
  />
)

test("assembly.screen selectors are isolated to the nearest assembly.device", async () => {
  const { circuit } = getTestFixture()
  const cadModel = ER_OLED096_1_3W_FLEXSCREEN_MODEL

  circuit.add(
    <group>
      <assembly.device name="left-watch">
        <board
          name="B1"
          width="20mm"
          height="20mm"
          pcbX="-22mm"
          routingDisabled
        >
          <Connector />
        </board>
        <assembly.screen
          name="SCREEN_LEFT"
          connectsTo=".B1 .J1"
          width={ER_OLED096_1_3W_SCREEN_WIDTH}
          height={ER_OLED096_1_3W_SCREEN_HEIGHT}
          cadModel={cadModel}
        />
      </assembly.device>
      <assembly.device name="right-watch">
        <board name="B1" width="20mm" height="20mm" pcbX="22mm" routingDisabled>
          <Connector />
        </board>
        <assembly.screen
          name="SCREEN_RIGHT"
          connectsTo=".B1 .J1"
          width={ER_OLED096_1_3W_SCREEN_WIDTH}
          height={ER_OLED096_1_3W_SCREEN_HEIGHT}
          cadModel={cadModel}
        />
      </assembly.device>
    </group>,
  )

  circuit.render()

  const screenSources = circuit.db.source_component
    .list()
    .filter((source) => source.name.startsWith("SCREEN_"))
  const screenCadComponents = circuit.db.cad_component
    .list()
    .filter((cad) =>
      screenSources.some(
        (source) => source.source_component_id === cad.source_component_id,
      ),
    )

  expect(screenSources).toHaveLength(2)
  expect(screenCadComponents).toHaveLength(2)
  expect(
    screenCadComponents.every((cad) => cad.footprinter_string === cadModel),
  ).toBe(true)
  const leftScreenSource = screenSources.find(
    (source) => source.name === "SCREEN_LEFT",
  )
  const rightScreenSource = screenSources.find(
    (source) => source.name === "SCREEN_RIGHT",
  )
  const leftScreenCad = screenCadComponents.find(
    (cad) => cad.source_component_id === leftScreenSource?.source_component_id,
  )
  const rightScreenCad = screenCadComponents.find(
    (cad) => cad.source_component_id === rightScreenSource?.source_component_id,
  )

  // A root-global selector would anchor both screens to the first `.B1 .J1`.
  // Distinct board transforms prove each selector stayed inside its own device.
  expect(leftScreenCad?.position.x).toBeCloseTo(-22)
  expect(rightScreenCad?.position.x).toBeCloseTo(22)

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [0, 55, 80],
    poppygl: {
      lookAt: [0, 5, 0],
      backgroundColor: [1, 1, 1],
      grid: false,
    },
  })
})
