import { test, expect } from "bun:test";
import { PrimitiveComponent, RootCircuit } from "lib";
import { selectOne } from "css-select";
import { cssSelectPrimitiveComponentAdapter } from "../../lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter";
import { grid } from "node_modules/@tscircuit/math-utils/dist/grid";

test.skip("selector-index2", () => {
  const circuit = new RootCircuit();
  circuit.add(
    <board width="10mm" height="10mm">
      <group>
        <resistor name="R1" resistance="10k" footprint="0402" />
        {grid({ rows: 8, cols: 8, xSpacing: 10, ySpacing: 10 }).map(
          ({ center, index }) => {
            return <led key={index} name={`LED${index}`} footprint="0402" />;
          },
        )}
        <resistor name="R2" resistance="10k" footprint="0402" />
      </group>
    </board>,
  );

  circuit.render();

  expect(
    selectOne("board .LED4 .pos", circuit as any, {
      adapter: cssSelectPrimitiveComponentAdapter as any,
    }).toString(),
  ).toInclude(`"pos"`);

  // Performance test comparing circuit.selectOne vs css-select's selectOne with adapter
  const iterations = 10_000;

  // Test circuit.selectOne
  const startCircuitSelectOne = performance.now();
  let circuitSelectOneResult: PrimitiveComponent | null;
  for (let i = 0; i < iterations; i++) {
    circuitSelectOneResult = circuit.selectOne("board .LED4 .pos");
  }
  const endCircuitSelectOne = performance.now();
  const circuitSelectOneTime = endCircuitSelectOne - startCircuitSelectOne;

  // Test css-select's selectOne with adapter
  const startCssSelectOne = performance.now();
  let cssSelectOneResult: PrimitiveComponent | null;
  for (let i = 0; i < iterations; i++) {
    cssSelectOneResult = selectOne("board .LED4 .pos", circuit as any, {
      adapter: cssSelectPrimitiveComponentAdapter as any,
    });
  }
  const endCssSelectOne = performance.now();
  const cssSelectOneTime = endCssSelectOne - startCssSelectOne;

  console.log(`Performance comparison (${iterations} iterations):`);
  console.log(
    `circuit.selectOne: ${circuitSelectOneTime.toFixed(2)}ms (${(circuitSelectOneTime / iterations).toFixed(3)}ms per call)`,
  );
  console.log(
    `css-select's selectOne: ${cssSelectOneTime.toFixed(2)}ms (${(cssSelectOneTime / iterations).toFixed(3)}ms per call)`,
  );
  console.log(
    cssSelectOneTime < circuitSelectOneTime
      ? `Ratio: css-select is ${((circuitSelectOneTime / cssSelectOneTime) * 100 - 100).toFixed(2)}% faster than circuit.selectOne`
      : `Ratio: css-select is ${(cssSelectOneTime / circuitSelectOneTime).toFixed(2)}x slower than circuit.selectOne`,
  );
});
