import { test, expect } from "bun:test";
import { useDiode } from "lib/hooks/use-diode";
import { RootCircuit } from "lib/RootCircuit";

test("useDiode hook creates component with correct props and traces", () => {
  const circuit = new RootCircuit();

  const D1 = useDiode("D1", { footprint: "1206" });
  const D2 = useDiode("D2", { footprint: "0603" });

  circuit.add(
    <board width="10mm" height="10mm">
      <D1 anode="net.VCC" cathode="net.GND" />
      <D2 pos={D1.anode} neg="net.GND" />
    </board>,
  );

  circuit.render();

  // Check if diode components were created correctly
  const diodes = circuit.selectAll("diode");
  expect(diodes.length).toBe(2);
  expect(diodes[0].props.name).toBe("D1");
  expect(diodes[0].props.footprint).toBe("1206");
  expect(diodes[1].props.name).toBe("D2");
  expect(diodes[1].props.footprint).toBe("0603");

  // Check if traces were created correctly
  const traces = circuit.selectAll("trace");
  expect(traces.length).toBe(4);
});
