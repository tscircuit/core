import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("source ports preserve declared electrical roles and output capabilities", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="12mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "INPUT",
          pin2: "OUTPUT",
          pin3: "BIDIRECTIONAL",
          pin4: "PASSIVE",
          pin5: "TRISTATE",
          pin6: "COLLECTOR",
          pin7: "EMITTER",
          pin8: "GPIO",
        }}
        pinAttributes={{
          INPUT: { isInput: true, isOutput: false, highlightColor: "#00ff00" },
          OUTPUT: { isOutput: true, isInput: false },
          BIDIRECTIONAL: { isBidirectional: true },
          PASSIVE: { isPassive: true },
          TRISTATE: { canUseTriState: true, isUsingTriState: false },
          COLLECTOR: {
            canUseOpenCollector: true,
            isUsingOpenCollector: false,
          },
          EMITTER: { canUseOpenEmitter: false, isUsingOpenEmitter: true },
          GPIO: { isGpio: true, isPassive: false },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourcePorts = circuit.db.source_port.list()
  expect(sourcePorts.find((port) => port.name === "INPUT")).toMatchObject({
    is_input: true,
    is_output: false,
    highlight_color: "#00ff00",
  })
  expect(sourcePorts.find((port) => port.name === "OUTPUT")).toMatchObject({
    is_input: false,
    is_output: true,
  })
  expect(
    sourcePorts.find((port) => port.name === "BIDIRECTIONAL"),
  ).toMatchObject({
    is_bidirectional: true,
  })
  expect(sourcePorts.find((port) => port.name === "PASSIVE")).toMatchObject({
    is_passive: true,
  })
  expect(sourcePorts.find((port) => port.name === "TRISTATE")).toMatchObject({
    can_use_tri_state: true,
    is_using_tri_state: false,
  })
  expect(sourcePorts.find((port) => port.name === "COLLECTOR")).toMatchObject({
    can_use_open_collector: true,
    is_using_open_collector: false,
  })
  expect(sourcePorts.find((port) => port.name === "EMITTER")).toMatchObject({
    can_use_open_emitter: false,
    is_using_open_emitter: true,
  })
  expect(sourcePorts.find((port) => port.name === "GPIO")).toMatchObject({
    is_gpio: true,
    is_passive: false,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
