import { it, expect } from "bun:test";
import "lib/register-catalogue";
import { Circuit, createElement } from "../index";

it("should allow usage of createElement without explicit React import", () => {
  const circuit = new Circuit();
  const groupElm = createElement(
    "group",
    {},
    createElement("led", { name: "LED2", footprint: "0402" }),
    createElement("resistor", {
      name: "R1",
      resistance: "10k",
      footprint: "0402",
    }),
  );

  circuit.add(groupElm);
  circuit.render();

  // Check that the circuit has the LED and resistor
  expect(circuit.db.source_component.select(".LED2")?.name).toBe("LED2");
  expect(circuit.db.source_component.select(".R1")?.name).toBe("R1");
});
