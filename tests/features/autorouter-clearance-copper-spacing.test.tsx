import { expect, test } from "bun:test"
import { checkPadTraceClearance } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouter clearance is respected by generated copper near an unrelated pad", async () => {
  for (const traceClearance of [0.25, 0.5]) {
    const { circuit } = getTestFixture({
      platform: { schematicDisabled: true },
    })
    circuit.add(
      <board
        width={14}
        height={8}
        autorouter={{ preset: "auto_local", traceClearance }}
      >
        <resistor name="R1" footprint="0402" resistance="1k" pcbX={-4} />
        <resistor name="R2" footprint="0402" resistance="1k" pcbX={4} />
        <resistor name="R3" footprint="0402" resistance="1k" pcbY={0.7} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
        <pcbnotetext
          text={`Requested copper clearance: ${traceClearance} mm`}
          pcbY={2.5}
          fontSize={0.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()
    const options = { minClearance: traceClearance }
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
    expect(checkPadTraceClearance(circuitJson, options)).toEqual([])
    expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${traceClearance}mm.test.tsx`),
      { showPcbNotes: true, shouldDrawRatsNest: false },
    )
  }
})
