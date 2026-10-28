import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import usbCC2765186CircuitJson from "tests/fixtures/assets/usb-c-C2765186.circuit.json"

test("standard usb_c connector fetches its manufacturerPartNumber instead of searching", async () => {
  const { circuit } = getTestFixture()
  const fetches: {
    supplierPartNumber?: string
    manufacturerPartNumber?: string
  }[] = []
  let findPartCalls = 0
  const partsEngine: PartsEngine = {
    findPart: async () => {
      findPartCalls++
      return { jlcpcb: ["C165948"] }
    },
    fetchPartCircuitJson: async ({
      supplierPartNumber,
      manufacturerPartNumber,
    }) => {
      fetches.push({ supplierPartNumber, manufacturerPartNumber })
      if (supplierPartNumber === "C165948")
        return usbCC165948CircuitJson as AnyCircuitElement[]
      if (
        !supplierPartNumber &&
        manufacturerPartNumber === "TYPE-C 16PIN 2MD(073)"
      )
        return usbCC2765186CircuitJson as AnyCircuitElement[]
      return undefined
    },
  }

  circuit.add(
    <board partsEngine={partsEngine} width="20mm" height="20mm">
      <connector
        name="USB1"
        standard="usb_c"
        manufacturerPartNumber="TYPE-C 16PIN 2MD(073)"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(findPartCalls).toBe(0)
  expect(fetches).toEqual([
    {
      supplierPartNumber: undefined,
      manufacturerPartNumber: "TYPE-C 16PIN 2MD(073)",
    },
  ])
  expect(circuit.db.pcb_smtpad.list().length).toBeGreaterThan(0)
})
