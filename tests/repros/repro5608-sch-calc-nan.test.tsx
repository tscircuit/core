import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro5608: unsupported schX/schY calc strings report source_invalid_component_property_error and do not produce NaN schematic centers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={40} height={30} routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "IN", pin2: "OUT" }}
        schX={3}
        pcbX={0}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-6}
        schX="calc(U1.pin1.x - 2mm)"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0603"
        pcbX={6}
        schX="3mm"
        schY="calc(board.minY + 3mm)"
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        pcbX={12}
        schX="calc(1mm + 2mm)"
        schY="calc(U1.pin1.y - 2mm)"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const name of ["R1", "R2", "R3"]) {
    const sourceComp = circuit.db.source_component
      .list()
      .find((comp) => comp.name === name)
    expect(sourceComp).toBeDefined()

    const schematicComp = circuit.db.schematic_component.getWhere({
      source_component_id: sourceComp!.source_component_id,
    })
    expect(schematicComp).toBeDefined()
    expect(Number.isFinite(schematicComp!.center.x)).toBe(true)
    expect(Number.isFinite(schematicComp!.center.y)).toBe(true)
  }

  const r2Source = circuit.db.source_component
    .list()
    .find((comp) => comp.name === "R2")!
  const r2Schematic = circuit.db.schematic_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!
  expect(r2Schematic.center.x).toBeCloseTo(3)
  expect(r2Schematic.center.y).toBeCloseTo(0)

  const propertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(propertyErrors).toHaveLength(4)

  const r1Source = circuit.db.source_component
    .list()
    .find((comp) => comp.name === "R1")!
  const r3Source = circuit.db.source_component
    .list()
    .find((comp) => comp.name === "R3")!

  expect(propertyErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        error_type: "source_invalid_component_property_error",
        property_name: "schX",
        source_component_id: r1Source.source_component_id,
        message: expect.stringContaining("calc(U1.pin1.x - 2mm)"),
      }),
      expect.objectContaining({
        error_type: "source_invalid_component_property_error",
        property_name: "schY",
        source_component_id: r2Source.source_component_id,
        message: expect.stringContaining("calc(board.minY + 3mm)"),
      }),
      expect.objectContaining({
        error_type: "source_invalid_component_property_error",
        property_name: "schX",
        source_component_id: r3Source.source_component_id,
        message: expect.stringContaining("calc(1mm + 2mm)"),
      }),
      expect.objectContaining({
        error_type: "source_invalid_component_property_error",
        property_name: "schY",
        source_component_id: r3Source.source_component_id,
        message: expect.stringContaining("calc(U1.pin1.y - 2mm)"),
      }),
    ]),
  )
})

test("repro5608: non-finite schematic coordinates, dimensions, and primitive schematic props emit validation errors without NaN", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={40} height={30} routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        schX="abc"
        schY={Infinity}
        schWidth="calc(1mm + 2mm)"
        schHeight="calc(board.maxY - 1mm)"
      />
      <group name="G1" schX="calc(1mm + 2mm)" schY="3mm">
        <resistor name="R1" resistance="1k" footprint="0603" />
      </group>
      <netlabel net="VCC" schX="calc(1mm + 2mm)" />
      <schematictext text="Note" schX="calc(1mm + 2mm)" schY="2mm" />
      <schematicbox width={2} height={2} schX="calc(1mm + 2mm)" />
    </board>,
  )

  await circuit.renderUntilSettled()

  for (const sc of circuit.db.schematic_component.list()) {
    expect(Number.isFinite(sc.center.x)).toBe(true)
    expect(Number.isFinite(sc.center.y)).toBe(true)
    expect(Number.isFinite(sc.size.width)).toBe(true)
    expect(Number.isFinite(sc.size.height)).toBe(true)
  }
  for (const sg of circuit.db.schematic_group.list()) {
    expect(Number.isFinite(sg.center.x)).toBe(true)
    expect(Number.isFinite(sg.center.y)).toBe(true)
  }
  for (const nl of circuit.db.schematic_net_label.list()) {
    expect(Number.isFinite(nl.center.x)).toBe(true)
    expect(Number.isFinite(nl.center.y)).toBe(true)
    expect(nl.anchor_position).toBeDefined()
    expect(Number.isFinite(nl.anchor_position!.x)).toBe(true)
    expect(Number.isFinite(nl.anchor_position!.y)).toBe(true)
  }
  for (const st of circuit.db.schematic_text.list()) {
    expect(Number.isFinite(st.position.x)).toBe(true)
    expect(Number.isFinite(st.position.y)).toBe(true)
  }
  for (const sb of circuit.db.schematic_box.list()) {
    expect(Number.isFinite(sb.x)).toBe(true)
    expect(Number.isFinite(sb.y)).toBe(true)
    expect(Number.isFinite(sb.width)).toBe(true)
    expect(Number.isFinite(sb.height)).toBe(true)
  }

  const propertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(propertyErrors.length).toBeGreaterThanOrEqual(8)
  expect(propertyErrors.map((e) => e.property_name)).toEqual(
    expect.arrayContaining(["schX", "schY", "schWidth", "schHeight"]),
  )
})

test("repro5608: ordinary string coordinates work, while symbol primitives, ErrorPlaceholder, and setProps guard against NaN", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={40} height={30} routingDisabled>
      <resistor
        name="R_VALID"
        resistance="1k"
        footprint="0603"
        schX="3mm"
        schY="-2.5mm"
      />
      <chip
        name="U_SYM"
        footprint="soic8"
        symbol={
          <symbol>
            <schematicrect
              schX="calc(1mm + 2mm)"
              width="calc(2mm)"
              height={1}
            />
            <schematicline x1="calc(1mm)" y1={0} x2={1} y2={0} />
            <schematiccircle
              center={{ x: "calc(1mm)", y: 0 }}
              radius="calc(0.5mm)"
            />
            <port name="pin1" direction="left" schX={-1} schY={0} />
          </symbol>
        }
      />
      {/* @ts-expect-error intentionally missing resistance to test ErrorPlaceholder */}
      <resistor name="R_MISSING" footprint="0603" schX="calc(1mm + 2mm)" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const rValidSource = circuit.db.source_component
    .list()
    .find((comp) => comp.name === "R_VALID")!
  const rValidSchematic = circuit.db.schematic_component.getWhere({
    source_component_id: rValidSource.source_component_id,
  })!
  expect(rValidSchematic.center.x).toBeCloseTo(3)
  expect(rValidSchematic.center.y).toBeCloseTo(-2.5)

  for (const rect of circuit.db.schematic_rect.list()) {
    expect(Number.isFinite(rect.center.x)).toBe(true)
    expect(Number.isFinite(rect.center.y)).toBe(true)
    expect(Number.isFinite(rect.width)).toBe(true)
    expect(Number.isFinite(rect.height)).toBe(true)
  }
  for (const line of circuit.db.schematic_line.list()) {
    expect(Number.isFinite(line.x1)).toBe(true)
    expect(Number.isFinite(line.y1)).toBe(true)
    expect(Number.isFinite(line.x2)).toBe(true)
    expect(Number.isFinite(line.y2)).toBe(true)
  }
  for (const circle of circuit.db.schematic_circle.list()) {
    expect(Number.isFinite(circle.center.x)).toBe(true)
    expect(Number.isFinite(circle.center.y)).toBe(true)
    expect(Number.isFinite(circle.radius)).toBe(true)
  }

  const failedErrors = circuit.db.source_failed_to_create_component_error.list()
  expect(failedErrors).toHaveLength(1)
  expect(Number.isFinite(failedErrors[0]!.schematic_center!.x)).toBe(true)
  expect(Number.isFinite(failedErrors[0]!.schematic_center!.y)).toBe(true)

  const propertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(propertyErrors.map((e) => e.property_name)).toEqual(
    expect.arrayContaining(["schX", "width", "x1", "center.x", "radius"]),
  )
  expect(
    propertyErrors.some((e) => e.message.includes("errorplaceholder")),
  ).toBe(false)

  const rValidComponent = circuit.selectOne(".R_VALID")!
  rValidComponent.setProps({
    ...rValidComponent.props,
    schX: "calc(4mm + 1mm)",
  })
  expect(rValidComponent._parsedProps.schX).toBeUndefined()
  rValidComponent.updateSourceComponentPropertyValidation()
  expect(
    circuit.db.source_invalid_component_property_error
      .list()
      .some((e) => e.message.includes("calc(4mm + 1mm)")),
  ).toBe(true)

  rValidComponent.setProps({
    ...rValidComponent.props,
    schX: "4mm",
  })
  expect(rValidComponent._parsedProps.schX).toBeCloseTo(4)
})
