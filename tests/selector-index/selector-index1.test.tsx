import { test, expect } from "bun:test";
import { PrimitiveComponent, RootCircuit } from "lib";
import { selectOne } from "css-select";
import { cssSelectPrimitiveComponentAdapter } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter";

test.skip("selector-index1", () => {
  const circuit = new RootCircuit();
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  );

  circuit.render();

  expect(
    selectOne("board .R1", circuit as any, {
      adapter: cssSelectPrimitiveComponentAdapter as any,
    }).toString(),
  ).toMatchInlineSnapshot(`"[object <resistor#0 name=".R1" />]"`);
  expect(
    selectOne("board > .R1", circuit as any, {
      adapter: cssSelectPrimitiveComponentAdapter as any,
    }).toString(),
  ).toMatchInlineSnapshot(`"[object <resistor#0 name=".R1" />]"`);
  expect(
    selectOne("board > .R1 .pin1", circuit as any, {
      adapter: cssSelectPrimitiveComponentAdapter as any,
    }).toString(),
  ).toMatchInlineSnapshot(`"[object <port#5(pin:1 .R1>.pin1) />]"`);
});
