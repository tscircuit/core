import { expect, test } from "bun:test"
import type { SourceSimpleInductor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor parses unit strings into numeric henries in source_component", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <inductor name="L1" inductance="10uH" />
      <inductor name="L2" inductance="100nH" />
      <inductor name="L3" inductance="5mH" />
      <inductor name="L4" inductance={0.001} />
    </board>,
  )

  circuit.render()

  const l1 = circuit.db.source_component.getWhere({
    name: "L1",
  }) as SourceSimpleInductor
  expect(typeof l1.inductance).toBe("number")
  expect(l1.inductance).toBeCloseTo(1e-5, 8)
  expect(l1.display_inductance).toBe("10µH")

  const l2 = circuit.db.source_component.getWhere({
    name: "L2",
  }) as SourceSimpleInductor
  expect(typeof l2.inductance).toBe("number")
  expect(l2.inductance).toBeCloseTo(1e-7, 10)
  expect(l2.display_inductance).toBe("100nH")

  const l3 = circuit.db.source_component.getWhere({
    name: "L3",
  }) as SourceSimpleInductor
  expect(typeof l3.inductance).toBe("number")
  expect(l3.inductance).toBeCloseTo(0.005, 5)
  expect(l3.display_inductance).toBe("5mH")

  const l4 = circuit.db.source_component.getWhere({
    name: "L4",
  }) as SourceSimpleInductor
  expect(typeof l4.inductance).toBe("number")
  expect(l4.inductance).toBe(0.001)
  expect(l4.display_inductance).toBe("1mH")
})
