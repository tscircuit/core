import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
  ER_OLED096_1_3W_FLEXSCREEN_MODEL,
} from "./fixtures/er-oled096-1-3w"

test("screens can reference nested subassembly containers declared later", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="device">
      <assembly.screen
        name="SCREEN"
        connectsTo=".module"
        cadModel={ER_OLED096_1_3W_FLEXSCREEN_MODEL}
      />
      <assembly.subassembly name="module">
        <assembly.cadassembly name="adapter" />
      </assembly.subassembly>
      <board name="B1" width={44} height={36} routingDisabled>
        <connector
          name="J1"
          pinCount={30}
          pcbX={0}
          pcbY={-13}
          footprint={ER_OLED096_1_3W_CONNECTOR_FOOTPRINT}
        />
      </board>
      <assembly.subassembly name="sibling" />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const pcbFor = (name: string) => {
    const source = circuit.db.source_component
      .list()
      .find((s) => s.name === name)!
    return circuit.db.pcb_component
      .list()
      .find((p) => p.source_component_id === source.source_component_id)!
  }
  expect(pcbFor("J1")).toBeDefined()
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
  for (const name of ["SCREEN", "module", "adapter", "sibling"]) {
    expect(pcbFor(name)).toBeUndefined()
  }
  expect(
    circuit.db.cad_component
      .list()
      .filter((c) => c.footprinter_string === ER_OLED096_1_3W_FLEXSCREEN_MODEL),
  ).toHaveLength(1)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [45, 38, 55],
    poppygl: { lookAt: [0, 0, 0], backgroundColor: [1, 1, 1], grid: false },
  })
})
