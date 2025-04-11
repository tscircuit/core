import type { Transistor } from "lib/components"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { it, expect } from "bun:test"

it("should map emitter and collector correctly for NPN", async () => {
    const { circuit } = getTestFixture()
    circuit.add(
        <board width="10mm" height="10mm">
            <transistor name="Q4" type="npn" schRotation={0} />
        </board>,
    )
    circuit.render()
    const transistor = circuit.selectOne("Transistor") as Transistor
    expect(transistor.emitter._parsedProps.aliases).toContain("e")
    expect(transistor.collector._parsedProps.aliases).toContain("c")
})

it("should map emitter and collector correctly for PNP", async () => {
    const { circuit } = getTestFixture()
    circuit.add(
        <board width="10mm" height="10mm">
            <transistor name="Q5" type="pnp" schRotation={0} />
        </board>,
    )
    circuit.render()
    const transistor = circuit.selectOne("Transistor") as Transistor
    expect(transistor.emitter._parsedProps.aliases).toContain("c")
    expect(transistor.collector._parsedProps.aliases).toContain("e")
})