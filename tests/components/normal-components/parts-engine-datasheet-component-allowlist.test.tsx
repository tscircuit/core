import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { DatasheetPartCircuitJsonRequest } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supplier footprints request datasheet enrichment only for chips and op amps", async () => {
  const { circuit } = getTestFixture()
  const requests: DatasheetPartCircuitJsonRequest[] = []
  const datasheetLookups: string[] = []
  const partsEngine: PartsEngine = {
    findPart: async () => ({ jlcpcb: ["C_CONNECTOR"] }),
    fetchPartCircuitJson: async (request: DatasheetPartCircuitJsonRequest) => {
      requests.push(request)
      // Model an engine whose constructor enables enrichment by default.
      if (request.includeDatasheetInformation ?? true) {
        datasheetLookups.push(request.supplierPartNumber!)
      }
      return external0402Footprint as AnyCircuitElement[]
    },
  }
  const supplierFootprint = (partNumber: string) => ({
    supplierPartNumbers: { jlcpcb: [partNumber] },
    footprint: `jlcpcb:${partNumber}`,
  })
  circuit.add(
    <board width={30} height={20} partsEngine={partsEngine} routingDisabled>
      <resistor
        name="R1"
        resistance="10k"
        {...supplierFootprint("C_R")}
        pcbX={-9}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        {...supplierFootprint("C_C")}
        pcbX={-6}
      />
      <inductor
        name="L1"
        inductance="10uH"
        {...supplierFootprint("C_L")}
        pcbX={-3}
      />
      <chip name="U1" {...supplierFootprint("C_CHIP")} />
      <opamp name="U2" {...supplierFootprint("C_OPAMP")} pcbX={3} />
      <pinout
        name="J1"
        pinLabels={{ pin1: "P1", pin2: "P2" }}
        {...supplierFootprint("C_PINOUT")}
        pcbX={6}
      />
      <connector name="J2" standard="jst_ph" pinCount={2} pcbX={9} />
      <pcbnotetext
        pcbY={-5}
        text="Datasheet lookups: U1 and U2 only"
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect([...new Set(datasheetLookups)].sort()).toEqual(["C_CHIP", "C_OPAMP"])
  for (const partNumber of ["C_R", "C_C", "C_L", "C_PINOUT", "C_CONNECTOR"]) {
    const imports = requests.filter(
      (request) => request.supplierPartNumber === partNumber,
    )
    expect(imports.length).toBeGreaterThan(0)
    expect(
      imports.every((request) => request.includeDatasheetInformation === false),
    ).toBe(true)
  }
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(14)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
