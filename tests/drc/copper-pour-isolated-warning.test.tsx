import { expect, test } from "bun:test"
import { pcb_copper_pour_isolated_warning } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board routing DRC emits and stores a renderable isolated copper pour warning", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={12}>
      <copperpour connectsTo="net.GND" layer="top" />
      <pcbnotetext
        text="GND copper: no pad or via connection"
        pcbY={3}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const warnings = circuit.db.pcb_copper_pour_isolated_warning.list()
  expect(warnings).toHaveLength(1)
  const warning = warnings[0]!
  expect(pcb_copper_pour_isolated_warning.parse(warning)).toEqual(warning)
  expect(warning.message).toContain("GND")
  expect(warning.layer).toBe("top")
  expect(
    circuit.db.pcb_copper_pour.get(warning.pcb_copper_pour_id),
  ).toBeDefined()
  expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
  const svg = convertCircuitJsonToPcbSvg(circuit.getCircuitJson(), {
    layer: "top",
    shouldDrawWarnings: true,
    width: 800,
    height: 500,
  })
  expect(svg).toContain('class="pcb-copper-pour-isolated-warning"')
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
