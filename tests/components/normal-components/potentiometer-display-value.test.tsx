
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("potentiometer display_max_resistance property", () => {
    const { project } = getTestFixture()

    project.add(
        <board width="10mm" height="10mm">
            <potentiometer name="R1" maxResistance="10k" pcbX={0} pcbY={0} />
        </board>,
    )

    project.render()

    const potentiometers = project.db.source_component.list({
        ftype: "simple_potentiometer",
    }) as Array<{
        ftype: "simple_potentiometer"
        display_max_resistance?: string
    }>

    expect(potentiometers).toHaveLength(1)
    expect(potentiometers[0].display_max_resistance).toBe("10kΩ")
})
