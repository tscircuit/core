import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const ImportedChip = (props: ChipProps) => (
  <chip footprint="soic8" pinLabels={{ pin1: "ENABLE" }} {...props} />
)

test("firmware attributes survive imported wrappers and subcircuits without adding defaults to other chips", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <group name="controller" subcircuit>
        <ImportedChip
          name="U1"
          firmwareRtos="nortos"
          firmwareLfClockSource="internal_rc"
          pinAttributes={{
            ENABLE: { isOutput: true, initialOutputState: "high" },
          }}
        />
      </group>
      <ImportedChip
        name="U2"
        pcbX={5}
        pinAttributes={{ ENABLE: { isBidirectional: true, isPassive: false } }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const chips = circuit.db.source_component.list()
  const configured = chips.find((chip) => chip.name === "U1")
  const unconfigured = chips.find((chip) => chip.name === "U2")
  if (unconfigured?.ftype !== "simple_chip")
    throw new Error("Missing ordinary chip")
  expect(configured).toMatchObject({
    firmware_rtos: "nortos",
    firmware_lf_clock_source: "internal_rc",
  })
  expect(unconfigured?.firmware_rtos).toBeUndefined()
  expect(unconfigured?.firmware_lf_clock_source).toBeUndefined()
  const ports = circuit.db.source_port.list()
  expect(
    ports.find(
      (port) =>
        port.source_component_id === configured?.source_component_id &&
        port.name === "ENABLE",
    ),
  ).toMatchObject({ is_output: true, initial_output_state: "high" })
  const unconfiguredPort = ports.find(
    (port) =>
      port.source_component_id === unconfigured?.source_component_id &&
      port.name === "ENABLE",
  )
  expect(unconfiguredPort).toMatchObject({
    is_bidirectional: true,
    is_passive: false,
  })
  expect(unconfiguredPort).not.toHaveProperty("initial_output_state")
  expect(unconfiguredPort).not.toHaveProperty("interrupt_trigger")
  expect(unconfiguredPort).not.toHaveProperty("is_input")
  expect(unconfiguredPort).not.toHaveProperty("is_output")
})
