import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSourceCapacitor } from "./test-utils"

test("does not infer decoupling from a power-providing chip port", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="REG1"
        footprint="soic8"
        pinLabels={{ pin1: "VOUT" }}
        pinAttributes={{ VOUT: { providesPower: true } }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".REG1 > .VOUT" to=".C1 > .1" />
      <trace from=".C1 > .2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.source_port.list().find((port) => port.name === "VOUT")
      ?.provides_power,
  ).toBe(true)
  expect(
    getSourceCapacitor(circuit, "C1")?.max_decoupling_trace_length,
  ).toBeUndefined()
})
