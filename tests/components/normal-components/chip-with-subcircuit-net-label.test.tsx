import { it, expect } from "bun:test";
import "lib/register-catalogue";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("subcircuit having a net label GND makes the circuit fail to use GND in other part of circuit", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
      <trace from=".U1 > .8" to="net.GND" />
    </board>,
  );

  circuit.render();

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(
    import.meta.dir + "-one-chip",
  );
});

it("should keep local nets isolated between adjacent subcircuits", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board
      width="30mm"
      height="30mm"
      schLayout={{
        flex: true,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      <group name="SubA" subcircuit>
        <chip
          name="U_A"
          footprint="soic8"
          pinLabels={{ "1": "IN_A", "2": "OUT_A", "3": "INTERNAL", "8": "GND" }}
          schPinArrangement={{ leftSize: 4, rightSize: 4 }}
        />
        <net name="INTERNAL" />
        <trace from=".U_A > .3" to="net.INTERNAL" />
      </group>
      <group name="SubB" subcircuit>
        <chip
          name="U_B"
          footprint="soic8"
          schX={8}
          pinLabels={{ "1": "IN_B", "2": "OUT_B", "3": "INTERNAL", "8": "GND" }}
          schPinArrangement={{ leftSize: 4, rightSize: 4 }}
        />
        <net name="INTERNAL" />
        <trace from=".U_B > .3" to="net.INTERNAL" />
      </group>

      <net name="EXTERNAL" />
      <trace from=".SubA > .U_A > .2" to="net.EXTERNAL" />
      <trace from=".SubB > .U_B > .2" to="net.EXTERNAL" />

      <trace from=".SubA > .U_A > .8" to="net.GND" />
      <trace from=".SubB > .U_B > .8" to="net.GND" />
    </board>,
  );

  circuit.render();

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(
    import.meta.dir + "-two-chips",
  );
});
