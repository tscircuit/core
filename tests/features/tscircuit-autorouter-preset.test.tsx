import { expect, test } from "bun:test"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"
import { getTestFixture } from "../fixtures/get-test-fixture"

test.each(["tscircuit", "tscircuit_beta"] as const)(
  "%s routes a board with the default autorouter and honors its options",
  async (preset) => {
    const config = { preset, allowViaInPad: true }
    expect(getPresetAutoroutingConfig(preset)).toEqual(
      getPresetAutoroutingConfig("default"),
    )
    expect(getPresetAutoroutingConfig(config)).toEqual(
      getPresetAutoroutingConfig({ preset: "default", allowViaInPad: true }),
    )

    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={10} autorouter={config}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  },
)
