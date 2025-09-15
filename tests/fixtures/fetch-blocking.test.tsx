import { it, expect } from "bun:test";
import { getTestFixture } from "./get-test-fixture";

const urls = [
  "https://registry-api.tscircuit.com/test",
  "https://api.tscircuit.com/test",
  "https://jlcsearch.tscircuit.com/test",
];

for (const url of urls) {
  it(`blocks fetch to ${url}`, async () => {
    getTestFixture();
    await expect(fetch(url)).rejects.toThrow(/not allowed/);
  });
}

it("blocks auto-cloud autorouter requests", async () => {
  const { circuit } = getTestFixture();
  const originalError = console.error;
  const errors: string[] = [];
  console.error = (...args) => {
    errors.push(args.join(" "));
    originalError(...args);
  };
  circuit.add(
    <board width="20mm" height="20mm" autorouter="auto-cloud">
      <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
      <resistor
        name="R1"
        resistance={100}
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  );
  await circuit.renderUntilSettled();
  console.error = originalError;
  expect(
    errors.some((e) =>
      e.includes("Network access to registry-api.tscircuit.com is not allowed"),
    ),
  ).toBe(true);
});
