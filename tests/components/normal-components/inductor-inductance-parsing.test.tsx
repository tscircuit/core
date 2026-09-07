import { expect, test } from "bun:test"
import type { SourceSimpleInductor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const inductanceOf = (circuit: any, name: string) =>
  circuit.db.source_component
    .list()
    .find(
      (sourceComponent: any): sourceComponent is SourceSimpleInductor =>
        sourceComponent.ftype === "simple_inductor" &&
        sourceComponent.name === name,
    )?.inductance

test("inductor unit strings reach Circuit JSON as numeric henries", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <inductor name="L1" inductance="10uH" footprint="0402" />
      <inductor name="L2" inductance="4.7mH" footprint="0402" />
      <inductor name="L3" inductance={0.001} footprint="0402" />
    </board>,
  )

  circuit.render()

  for (const name of ["L1", "L2", "L3"]) {
    expect(typeof inductanceOf(circuit, name)).toBe("number")
  }

  expect(inductanceOf(circuit, "L1")).toBeCloseTo(0.00001, 12)
  expect(inductanceOf(circuit, "L2")).toBeCloseTo(0.0047, 12)
  expect(inductanceOf(circuit, "L3")).toBeCloseTo(0.001, 12)
})
