import { expect, test } from "bun:test"
import { assembly } from "lib"
import {
  ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
  ER_OLED096_1_3W_CONTACT_COUNT,
  ER_OLED096_1_3W_SCREEN_HEIGHT,
  ER_OLED096_1_3W_SCREEN_WIDTH,
} from "tests/assembly/fixtures/er-oled096-1-3w"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly.screen derives its default model from dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <assembly.device name="dimension-derived-watch">
      <board name="B1" width="44mm" height="36mm" routingDisabled>
        <connector
          name="J1"
          pinCount={ER_OLED096_1_3W_CONTACT_COUNT}
          footprint={ER_OLED096_1_3W_CONNECTOR_FOOTPRINT}
        />
      </board>
      <assembly.screen
        name="SCREEN"
        connectsTo=".B1 .J1"
        width={ER_OLED096_1_3W_SCREEN_WIDTH}
        height={ER_OLED096_1_3W_SCREEN_HEIGHT}
      />
    </assembly.device>,
  )
  circuit.render()

  const screenSource = circuit.db.source_component
    .list()
    .find((source) => source.name === "SCREEN")
  const screenCad = circuit.db.cad_component
    .list()
    .find(
      (cadComponent) =>
        cadComponent.source_component_id === screenSource?.source_component_id,
    )

  expect(screenCad?.footprinter_string).toBe("flexscreen_w26.7mm_h19.26mm")
})
