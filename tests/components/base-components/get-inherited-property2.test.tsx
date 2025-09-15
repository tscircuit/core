import { it, expect } from "bun:test";
import { Chip } from "lib/components/normal-components/Chip";
import { RootCircuit } from "lib/RootCircuit";
import "lib/register-catalogue";
import type { PartsEngine } from "@tscircuit/props";

it("should correctly get properties from root circuit platform", () => {
  const customPartsEngine: PartsEngine = {
    findPart: (elm: any) => {},
  } as any;
  const circuit = new RootCircuit({
    platform: {
      partsEngine: customPartsEngine,
    },
  });

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1">
        <chip name="U1" />
      </group>
    </board>,
  );

  circuit.render();

  const chip = circuit.selectOne("chip") as Chip;

  expect(chip.getInheritedProperty("partsEngine")).toBe(customPartsEngine);
});
