import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function countPcbElements(circuitJson: CircuitJson) {
  return {
    components: circuitJson.filter(
      (element) => element.type === "pcb_component",
    ).length,
    traces: circuitJson.filter((element) => element.type === "pcb_trace")
      .length,
    errors: circuitJson.filter((element) => element.type.includes("error"))
      .length,
  }
}

test.failing(
  "group subcircuit imports two resistors and their routed trace",
  async () => {
    const { circuit: sourceCircuit } = getTestFixture()
    sourceCircuit.add(
      <board width={20} height={10} schematicDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" pcbStraightLine />
      </board>,
    )
    await sourceCircuit.renderUntilSettled()
    const input = sourceCircuit.getCircuitJson()
    const expected = { components: 2, traces: 1, errors: 0 }
    expect(countPcbElements(input)).toEqual(expected)

    const { circuit: importedCircuit } = getTestFixture()
    importedCircuit.add(
      <board width={20} height={10} schematicDisabled>
        <group subcircuit circuitJson={input} />
      </board>,
    )
    await importedCircuit.renderUntilSettled()
    const output = importedCircuit.getCircuitJson()
    const actual = countPcbElements(output)
    const passed =
      actual.components === expected.components &&
      actual.traces === expected.traces &&
      actual.errors === expected.errors
    const pcb = convertCircuitJsonToPcbSvg(output, {
      width: 1000,
      height: 480,
    }).replace("<svg ", '<svg x="0" y="220" ')

    // Capture actual output for before/after review, not an expected baseline.
    // The behavioral assertion below remains the source of pass/fail truth.
    await Bun.write(
      new URL(
        "./__snapshots__/group-circuit-json-import.observed.svg",
        import.meta.url,
      ),
      `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
<rect width="1000" height="700" fill="#0b1220"/>
<g font-family="sans-serif" fill="#eef4fc">
<text x="28" y="38" font-size="24" font-weight="bold">Repro: import two resistors and their routed trace</text>
<text x="28" y="76" font-size="20">Input: core-generated JSON via &lt;group subcircuit circuitJson={input} /&gt;</text>
<text x="28" y="113" font-size="20">Expected: ${expected.components} component${expected.components === 1 ? "" : "s"} / ${expected.traces} trace${expected.traces === 1 ? "" : "s"} / ${expected.errors} error${expected.errors === 1 ? "" : "s"}</text>
<text x="28" y="150" font-size="20">Observed: ${actual.components} component${actual.components === 1 ? "" : "s"} / ${actual.traces} trace${actual.traces === 1 ? "" : "s"} / ${actual.errors} error${actual.errors === 1 ? "" : "s"}</text>
<text x="28" y="194" font-size="24" font-weight="bold" fill="${passed ? "#60dfab" : "#ff8585"}">${passed ? "PASS: imported components and trace preserved" : "FAIL: imported components and trace missing"}</text>
</g>${pcb}</svg>`,
    )
    expect(actual).toEqual(expected)
  },
)
