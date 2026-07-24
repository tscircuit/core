import { expect, it } from "bun:test"
import { Transistor } from "lib/components/normal-components/Transistor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should expose accessors consistent with pin aliases (pin1=collector, pin2=base, pin3=emitter)", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" type="npn" />
    </board>,
  )
  circuit.render()
  const t = circuit.selectOne("Transistor") as Transistor
  expect(t.collector).toBe(t.portMap.pin1)
  expect(t.base).toBe(t.portMap.pin2)
  expect(t.emitter).toBe(t.portMap.pin3)
})
