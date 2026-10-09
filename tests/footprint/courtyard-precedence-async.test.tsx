import { expect, test } from "bun:test"
import { getCourtyardTestFootprintCircuitJson } from "tests/fixtures/courtyard-test-footprint"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

test("explicit courtyards replace asynchronously loaded footprint defaults", async () => {
  const footprintCircuitJson = getCourtyardTestFootprintCircuitJson()
  const { url } = getTestFootprintServer(footprintCircuitJson)
  let libraryLoads = 0
  let parserLoads = 0
  let supplierLoads = 0
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => {
          await Bun.sleep(10)
          libraryLoads++
          return { footprintCircuitJson }
        },
      },
      footprintFileParserMap: {
        kicad_mod: {
          loadFromUrl: async () => {
            await Bun.sleep(10)
            parserLoads++
            return { footprintCircuitJson }
          },
        },
      },
      partsEngine: {
        findPart: async () => ({}),
        fetchPartCircuitJson: async () => {
          await Bun.sleep(10)
          supplierLoads++
          return footprintCircuitJson
        },
      },
    },
  })

  circuit.add(
    <board width={24} height={14} routingDisabled>
      <capacitor
        name="C0"
        capacitance="100nF"
        footprint="kicad:Default"
        pcbX={-7}
        pcbY={3}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="kicad:Override"
        pcbY={3}
      >
        <courtyardrect width={1.66} height={0.74} />
      </capacitor>
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint={`${url}/footprint.json`}
        pcbX={7}
        pcbY={3}
      >
        <courtyardrect width={1.66} height={0.74} />
      </capacitor>
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint={`${url}/footprint.kicad_mod`}
        pcbX={-4}
        pcbY={-3}
      >
        <courtyardcircle radius={1} />
      </capacitor>
      <capacitor
        name="C4"
        capacitance="100nF"
        footprint="mouser:123456"
        supplierPartNumbers={{ mouser: ["123456"] }}
        pcbX={4}
        pcbY={-3}
      >
        <courtyardoutline
          outline={[
            { x: -0.83, y: -0.37 },
            { x: 0.83, y: -0.37 },
            { x: 0.83, y: 0.37 },
            { x: -0.83, y: 0.37 },
          ]}
        />
      </capacitor>
      <pcbnotetext
        pcbY={6}
        text="C0: library default   C1: library   C2: JSON URL"
        fontSize={0.5}
      />
      <pcbnotetext
        pcbY={-6}
        text="C3: file parser   C4: supplier parts engine"
        fontSize={0.6}
      />
    </board>,
  )
  circuit.render()
  await circuit.renderUntilSettled()

  expect(libraryLoads).toBe(2)
  expect(parserLoads).toBe(1)
  expect(supplierLoads).toBeGreaterThan(0)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(10)
  expect(circuit.db.pcb_courtyard_rect.list()).toHaveLength(3)
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(2)
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(2)
  const defaultPartId = circuit.selectOne(".C0")!.pcb_component_id
  expect(
    circuit.db.pcb_courtyard_rect
      .list()
      .filter((rect) => rect.pcb_component_id !== defaultPartId),
  ).toMatchObject([
    { width: 1.66, height: 0.74 },
    { width: 1.66, height: 0.74 },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
