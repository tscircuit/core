import { test, expect } from "bun:test";
import { sel } from "lib/sel";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("sel supports MOSFET pin names (gate, source, drain)", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board>
      <mosfet
        name="Q1"
        footprint="sot23"
        channelType="n"
        mosfetMode="enhancement"
      />
      <trace from={sel.Q1.gate} to={sel.net.GND} />
      <trace from={sel.Q1.source} to={sel.net.V3_3} />
      <trace from={sel.Q1.drain} to={sel.net.V3_3} />
    </board>,
  );

  circuit.render();

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([]);

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
