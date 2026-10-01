import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const ImportedChip = (props: ChipProps) => (
  <chip footprint="soic8" pinLabels={{ pin1: "SIGNAL" }} {...props} />
)

test("electrical attributes survive imported wrappers and physical pin alias overrides", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <group name="controller" subcircuit>
        <ImportedChip
          name="U1"
          pinAttributes={{
            SIGNAL: { isInput: true, isOutput: true, isGpio: true },
            pin1: { isInput: false },
          }}
        />
      </group>
      <ImportedChip name="U2" pcbX={5} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourceChips = circuit.db.source_component.list()
  const configuredChip = sourceChips.find((chip) => chip.name === "U1")
  const ordinaryChip = sourceChips.find((chip) => chip.name === "U2")
  const sourcePorts = circuit.db.source_port.list()
  expect(
    sourcePorts.find(
      (port) =>
        port.source_component_id === configuredChip?.source_component_id &&
        port.name === "SIGNAL",
    ),
  ).toMatchObject({ is_input: false, is_output: true, is_gpio: true })
  const ordinaryPort = sourcePorts.find(
    (port) =>
      port.source_component_id === ordinaryChip?.source_component_id &&
      port.name === "SIGNAL",
  )
  expect(ordinaryPort).toBeDefined()
  expect(ordinaryPort).not.toHaveProperty("is_input")
  expect(ordinaryPort).not.toHaveProperty("is_output")
  expect(ordinaryPort).not.toHaveProperty("is_gpio")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
