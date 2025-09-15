import { expect, it, describe } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should not render chip in schematic when noSchematicRepresentation is true", async () => {
  const { circuit } = getTestFixture();
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        manufacturerPartNumber="ATmega8-16A"
        footprint="soic8"
        noSchematicRepresentation={true}
      />
    </board>,
  );
  circuit.render();

  // Verify that the chip exists but isn't in schematic
  const chip = circuit.selectOne("chip[name='U1']");
  expect(chip).not.toBeNull();
  expect(chip!.props.noSchematicRepresentation).toBe(true);

  // Verify no schematic component exists
  const schematic_component = circuit.db.schematic_component.list();
  const isChipInSchematic = schematic_component.some(
    (sc) => sc.source_component_id === chip!.source_component_id,
  );
  expect(isChipInSchematic).toBe(false);

  // Verify no schematic ports exist for this chip
  const schematic_ports = circuit.db.schematic_port.list();
  const chipSchematicComponent = schematic_component.find(
    (sc) => sc.source_component_id === chip!.source_component_id,
  );
  const chipPorts = chipSchematicComponent
    ? schematic_ports.filter(
        (port) =>
          port.schematic_component_id ===
          chipSchematicComponent.schematic_component_id,
      )
    : [];
  expect(chipPorts.length).toBe(0);

  // Verify schematic snapshot for true case
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-noSchematicTrue",
  );
});

it("should render chip in schematic when noSchematicRepresentation is false", async () => {
  const { circuit } = getTestFixture();
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U2"
        manufacturerPartNumber="ATmega8-16A"
        footprint="soic8"
        noSchematicRepresentation={false}
      />
    </board>,
  );
  circuit.render();

  // Verify that the chip exists and is in schematic
  const chip = circuit.selectOne("chip[name='U2']");
  expect(chip).not.toBeNull();
  expect(chip!.props.noSchematicRepresentation).toBe(false);

  // Verify schematic component exists
  const schematic_component = circuit.db.schematic_component.list();
  const isChipInSchematic = schematic_component.some(
    (sc) => sc.source_component_id === chip!.source_component_id,
  );
  expect(isChipInSchematic).toBe(true);

  // Verify schematic ports exist
  const schematic_ports = circuit.db.schematic_port.list();
  const chipSchematicComponent = schematic_component.find(
    (sc) => sc.source_component_id === chip!.source_component_id,
  );
  const chipPorts = chipSchematicComponent
    ? schematic_ports.filter(
        (port) =>
          port.schematic_component_id ===
          chipSchematicComponent.schematic_component_id,
      )
    : [];
  expect(chipPorts.length).toBeGreaterThan(0);

  // Verify schematic snapshot for false case
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-noSchematicFalse",
  );
});

it("should render chip in schematic when noSchematicRepresentation is undefined", async () => {
  const { circuit } = getTestFixture();
  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U3" manufacturerPartNumber="ATmega8-16A" footprint="soic8" />
    </board>,
  );
  circuit.render();

  // Verify that the chip exists and is in schematic
  const chip = circuit.selectOne("chip[name='U3']");
  expect(chip).not.toBeNull();
  expect(chip!.props.noSchematicRepresentation).toBeUndefined();

  // Verify schematic component exists
  const schematic_component = circuit.db.schematic_component.list();
  const isChipInSchematic = schematic_component.some(
    (sc) => sc.source_component_id === chip!.source_component_id,
  );
  expect(isChipInSchematic).toBe(true);

  // Verify schematic ports exist
  const schematic_ports = circuit.db.schematic_port.list();
  const chipSchematicComponent = schematic_component.find(
    (sc) => sc.source_component_id === chip!.source_component_id,
  );
  const chipPorts = chipSchematicComponent
    ? schematic_ports.filter(
        (port) =>
          port.schematic_component_id ===
          chipSchematicComponent.schematic_component_id,
      )
    : [];
  expect(chipPorts.length).toBeGreaterThan(0);

  // Verify schematic snapshot for undefined case
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-noSchematicUndefined",
  );
});
