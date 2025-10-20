import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Ensure TestPoint renders correctly */
test("<testpoint /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <testpoint
        name="TP1"
        holeDiameter="0.6mm"
        footprintVariant="through_hole"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("<testpoint /> component with netlabel test", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <testpoint name="TP1" schX={0} schY={0.5} schRotation={180} />
      <testpoint name="TP2" schX={0} schY={0} schRotation={180} />
      <testpoint name="TP3" schX={0} schY={-0.5} schRotation={180} />
      <netlabel
        schX={0.8}
        schY={0.9}
        net="VCC"
        anchorSide="bottom"
        connection="TP1.pin1"
      />
      <netlabel
        schX={0.8}
        schY={0}
        net="COPI"
        anchorSide="left"
        connection="TP2.pin1"
      />
      <netlabel
        schX={0.8}
        schY={-0.9}
        net="GND"
        anchorSide="top"
        connection="TP3.pin1"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])

  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + ".schematic-netlabels",
  )
})

test("<testpoint /> without hole renders SMT pad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <testpoint name="TP1" withouthole />
    </board>,
  )

  circuit.render()

  expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])

  const sourceComponent = circuit.db.source_component.getWhere({
    name: "TP1",
  }) as any

  expect(sourceComponent?.footprint_variant).toBe("pad")
  expect(sourceComponent?.pad_shape).toBe("circle")
  expect(sourceComponent?.hole_diameter).toBeUndefined()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + ".withouthole")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path + ".withouthole")
})
