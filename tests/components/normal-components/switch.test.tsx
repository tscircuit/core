import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<switch /> inserts simulation_switch when simulation props provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <switch
        name="SW1"
        spst
        // @ts-expect-error Switch simulation props are currently typed downstream
        simulation={{
          closesAt: 1,
          opensAt: 2,
          startsClosed: true,
          switchingFrequency: 3,
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const simulationSwitches = (circuit.db as any).simulation_switch.list()

  expect(simulationSwitches).toHaveLength(1)

  const simulationSwitch = simulationSwitches[0]
  expect(simulationSwitch.type).toBe("simulation_switch")
  expect(simulationSwitch.closes_at).toBe(1)
  expect(simulationSwitch.opens_at).toBe(2)
  expect(simulationSwitch.starts_closed).toBe(true)
  expect(simulationSwitch.switching_frequency).toBe(3)
})

test("<switch /> does not insert simulation_switch without simulation props", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <switch name="SW1" spst />
    </board>,
  )

  await circuit.renderUntilSettled()

  const simulationSwitches = (circuit.db as any).simulation_switch.list()

  expect(simulationSwitches).toHaveLength(0)
})

test("should render a switch", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <switch name="SW1" type="spst" schX={2} schY={2} />
      <switch name="SW2" spst schX={-2} schY={-2} />
      <switch name="SW3" type="spdt" schX={0} schY={0} />
      <switch name="SW4" schX={2} schY={-2} />
      <switch name="SW5" dpdt schX={-2} schY={2} />
      <switch name="SW6" isNormallyClosed dpdt schX={0} schY={2} />
      <switch name="SW7" isNormallyClosed schX={-1} schY={1} />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
