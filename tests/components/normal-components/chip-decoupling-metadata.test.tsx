import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("emits chip decoupling metadata for external checks", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <chip
        name="U_MISSING"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        pinAttributes={{
          VCC: {
            requiresPower: true,
            recommendedDecouplingCapacitorCapacitance: "100nF",
          },
          GND: { requiresGround: true },
        }}
      />
      <trace from=".U_MISSING > .VCC" to="net.VCC_MISSING" />
      <trace from=".U_MISSING > .GND" to="net.GND" />

      <chip
        name="U_WITH_CAP"
        pinLabels={{ pin1: "VDD", pin2: "GND" }}
        pinAttributes={{ GND: { requiresGround: true } }}
      />
      <capacitor name="C1" capacitance="100nF" />
      <trace from=".U_WITH_CAP > .VDD" to=".C1 > .pin1" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".U_WITH_CAP > .GND" to="net.GND" />

      <chip
        name="U_OPT_OUT"
        pinLabels={{ pin1: "VBAT", pin2: "GND" }}
        pinAttributes={{
          VBAT: {
            requiresPower: true,
            shouldHaveDecouplingCapacitor: false,
          },
          GND: { requiresGround: true },
        }}
      />
      <trace from=".U_OPT_OUT > .VBAT" to="net.VBAT" />
      <trace from=".U_OPT_OUT > .GND" to="net.GND" />

      <chip
        name="U_POWER_SOURCE"
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        pinAttributes={{
          VCC: { providesPower: true },
          GND: { providesGround: true },
        }}
      />
      <trace from=".U_POWER_SOURCE > .VCC" to="net.VCC_SOURCE" />
      <trace from=".U_POWER_SOURCE > .GND" to="net.GND" />

      <schematictext
        text="Decoupling requirements are emitted as source-port metadata"
        schX={0}
        schY={-5}
        fontSize={0.3}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponentsByName = new Map(
    circuit.db.source_component
      .list()
      .map((sourceComponent) => [sourceComponent.name, sourceComponent]),
  )
  const getSourcePortByHint = (sourceComponentName: string, portHint: string) =>
    circuit.db.source_port
      .list()
      .find(
        (sourcePort) =>
          sourcePort.source_component_id ===
            sourceComponentsByName.get(sourceComponentName)
              ?.source_component_id &&
          sourcePort.port_hints?.includes(portHint),
      )

  expect(getSourcePortByHint("U_MISSING", "VCC")).toMatchObject({
    requires_power: true,
    should_have_decoupling_capacitor: true,
    recommended_decoupling_capacitor_capacitance: "100nF",
  })
  expect(getSourcePortByHint("U_MISSING", "GND")).toMatchObject({
    requires_ground: true,
    should_have_decoupling_capacitor: false,
  })
  expect(getSourcePortByHint("U_WITH_CAP", "VDD")).toMatchObject({
    should_have_decoupling_capacitor: true,
  })
  expect(getSourcePortByHint("U_OPT_OUT", "VBAT")).toMatchObject({
    requires_power: true,
    should_have_decoupling_capacitor: false,
  })
  expect(getSourcePortByHint("U_POWER_SOURCE", "VCC")).toMatchObject({
    provides_power: true,
    should_have_decoupling_capacitor: false,
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
