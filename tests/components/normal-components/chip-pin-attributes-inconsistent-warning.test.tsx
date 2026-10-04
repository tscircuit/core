import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("contradictory electrical attributes are summarized once per chip", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        footprint="pinrow3"
        pinLabels={{ pin1: "NC", pin2: "GROUND", pin3: "DATA" }}
        pinAttributes={{
          NC: { doNotConnect: true, mustBeConnected: true },
          GROUND: { requiresGround: true, requiresVoltage: "3.3V" },
          DATA: {
            isOutput: true,
            isUsingOpenDrain: true,
            canUseOpenDrain: false,
          },
        }}
      />
      <pcbnotetext
        text="NC requires connection; ground at 3.3V; unsupported open drain"
        pcbY={-3}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.message).toContain(
    "NC (doNotConnect conflicts with mustBeConnected)",
  )
  expect(warnings[0]!.message).toContain(
    "GROUND (ground pin declares a nonzero voltage)",
  )
  expect(warnings[0]!.message).toContain(
    "DATA (isUsingOpenDrain conflicts with canUseOpenDrain: false)",
  )
  expect(warnings[0]!.source_port_ids).toHaveLength(3)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
