import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net label uses component displayName if available", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
        <board width="10mm" height="10mm">
            <chip
                name="U1"
                displayName="MCU"
                footprint="soic8"
                pinLabels={{ "1": "VCC", "2": "GND" }}
            />
            <resistor name="R1" resistance="1k" footprint="0402" />
            <trace from=".U1 > .pin1" to=".R1 > .pin1" />
        </board>
    )

    circuit.render()

    const u1 = circuit.selectOne("chip")
    const pin1 = u1?.children.find(c => c.componentName === "Port" && c.props.pinNumber === 1)

    expect((pin1 as any)?._getNetLabelText()).toBe("MCU_VCC")
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
