import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a two-pin crystal", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <crystal
        name="X1"
        frequency="1MHz"
        loadCapacitance="20pF"
        pinVariant="two_pin"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-crystal-two-pin",
  )
})

it("should render a four-pin crystal", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <crystal
        name="X1"
        frequency="16MHz"
        loadCapacitance="22pF"
        pinVariant="four_pin"
      />
      <crystal
        name="X2"
        frequency="16MHz"
        loadCapacitance="22pF"
        pinVariant="four_pin"
        schRotation={90}
        schY={3}
      />
      <crystal
        name="X3"
        frequency="16MHz"
        loadCapacitance="22pF"
        pinVariant="four_pin"
        schRotation={180}
        schY={-3}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-crystal-four-pin",
  )
})

it("should render a crystal without pinVariant specified (default to two-pin)", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <crystal name="X3" frequency="8MHz" loadCapacitance="15pF" />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-crystal-default",
  )
})

it("should obstruct packing within bounds when obstructsWithinBounds is set", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pack gap="1mm">
      <crystal
        name="Y1"
        footprint="hc49"
        loadCapacitance="18pF"
        frequency="12MHz"
        pcbX={0}
        pcbY={-15}
        obstructsWithinBounds
        connections={{ pin1: "U3.XIN", pin2: "net.XOUT_CRYSTAL" }}
      />
      <capacitor
        name="C3"
        footprint="0402"
        capacitance="27pF"
        connections={{ pos: "Y1.pin2" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const crystalComponent = circuit.selectOne(".Y1")
  const capacitorComponent = circuit.selectOne(".C3")

  expect(crystalComponent?.pcb_component_id).toBeDefined()
  expect(capacitorComponent?.pcb_component_id).toBeDefined()

  const crystalPcb = circuit.db.pcb_component.get(
    crystalComponent!.pcb_component_id!,
  )
  const capacitorPcb = circuit.db.pcb_component.get(
    capacitorComponent!.pcb_component_id!,
  )

  expect(crystalPcb).not.toBeNull()
  expect(capacitorPcb).not.toBeNull()

  const crystalBounds = {
    minX: crystalPcb!.center.x - crystalPcb!.width / 2,
    maxX: crystalPcb!.center.x + crystalPcb!.width / 2,
    minY: crystalPcb!.center.y - crystalPcb!.height / 2,
    maxY: crystalPcb!.center.y + crystalPcb!.height / 2,
  }

  const capacitorCenter = capacitorPcb!.center

  const capacitorInsideCrystalBounds =
    capacitorCenter.x > crystalBounds.minX &&
    capacitorCenter.x < crystalBounds.maxX &&
    capacitorCenter.y > crystalBounds.minY &&
    capacitorCenter.y < crystalBounds.maxY

  expect(capacitorInsideCrystalBounds).toBe(false)

  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-crystal-obstructs-within-bounds",
  )
})
