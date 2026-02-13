import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("board should emit error when chip is off board", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
        <board width="10mm" height="10mm">
            <chip name="U1" footprint="soic8" pcbX={20} pcbY={0} />
            {/* Add a trace to trigger autorouting/DRC */}
            <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
            <trace from=".U1 > .pin1" to=".R1 > .pin1" />
        </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()
    const outsideErrors = circuitJson.filter(
        (el) => el.type === "pcb_component_outside_board_error",
    )

    expect(outsideErrors.length).toBeGreaterThan(0)
})

test("board should allow chip off board when allowOffBoard is true", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
        <board width="10mm" height="10mm">
            {/* @ts-ignore - prop not yet added */}
            <chip name="U1" footprint="soic8" pcbX={20} pcbY={0} allowOffBoard />
            <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
            <trace from=".U1 > .pin1" to=".R1 > .pin1" />
        </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()
    const outsideErrors = circuitJson.filter(
        (el) => el.type === "pcb_component_outside_board_error",
    )

    expect(outsideErrors.length).toBe(0)
})
