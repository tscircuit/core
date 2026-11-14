import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("non-finite calc positions report a property error and render finite coordinates", () => {
  const invalidExpressions = [
    "calc(1mm / 0)",
    "calc(-1mm / 0)",
    "calc(0mm / 0)",
    "calc(1mm / (board.maxX - board.maxX))",
    `calc(${"9".repeat(400)}mm)`,
  ]

  for (const expression of invalidExpressions) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="20mm" height="10mm" routingDisabled schematicDisabled>
        <resistor
          name="R_BAD"
          footprint="0402"
          resistance="1k"
          pcbX={expression}
          pcbY={1}
        />
        <resistor
          name="R_OK"
          footprint="0402"
          resistance="2k"
          pcbX="calc(board.maxX - 1mm)"
          pcbY={-2}
        />
      </board>,
    )

    expect(() => circuit.render()).not.toThrow()

    const sourceComponents = circuit.db.source_component.list()
    const invalidSourceComponent = sourceComponents.find(
      (sourceComponent) => sourceComponent.name === "R_BAD",
    )!
    const validSourceComponent = sourceComponents.find(
      (sourceComponent) => sourceComponent.name === "R_OK",
    )!
    const invalidPcbComponent = circuit.db.pcb_component
      .list()
      .find(
        (pcbComponent) =>
          pcbComponent.source_component_id ===
          invalidSourceComponent.source_component_id,
      )!
    const validPcbComponent = circuit.db.pcb_component
      .list()
      .find(
        (pcbComponent) =>
          pcbComponent.source_component_id ===
          validSourceComponent.source_component_id,
      )!

    expect(invalidPcbComponent.center).toEqual({ x: 0, y: 1 })
    expect(validPcbComponent.center).toEqual({ x: 9, y: -2 })

    const invalidPropertyErrors =
      circuit.db.source_invalid_component_property_error.list()
    expect(invalidPropertyErrors).toHaveLength(1)
    expect(invalidPropertyErrors[0].source_component_id).toBe(
      invalidSourceComponent.source_component_id,
    )
    expect(invalidPropertyErrors[0].property_name).toBe("pcbX")
    expect(invalidPropertyErrors[0].message).toContain(
      "calc() expression must evaluate to a finite number",
    )
    expect(invalidPropertyErrors[0].message).toContain(expression)

    for (const pcbComponent of circuit.db.pcb_component.list()) {
      expect(Number.isFinite(pcbComponent.center.x)).toBe(true)
      expect(Number.isFinite(pcbComponent.center.y)).toBe(true)
    }
    for (const pad of circuit.db.pcb_smtpad.list()) {
      const padPositions = pad.shape === "polygon" ? pad.points : [pad]
      for (const padPosition of padPositions) {
        expect(Number.isFinite(padPosition.x)).toBe(true)
        expect(Number.isFinite(padPosition.y)).toBe(true)
      }
    }
    expect(
      circuit.db.source_failed_to_create_component_error.list(),
    ).toHaveLength(0)
  }
})
