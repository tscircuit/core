import { expect, test } from "bun:test"
import { Resistor } from "lib/components/normal-components/Resistor"
import {
  type DatasheetPartCircuitJsonRequest,
  fetchPartCircuitJsonWithDatasheet,
} from "lib/utils/fetch-part-circuit-json-with-datasheet"

test("a failed passive import never retries with engine-default enrichment", async () => {
  const requests: DatasheetPartCircuitJsonRequest[] = []
  const failure = new Error("Supplier is unavailable")
  await expect(
    fetchPartCircuitJsonWithDatasheet(
      {
        supplierPartNumber: "C_R",
        fetchPartCircuitJson: async (request) => {
          requests.push(request)
          throw failure
        },
      },
      new Resistor({ name: "R1", resistance: "10k" }),
    ),
  ).rejects.toBe(failure)
  expect(
    requests.map((request) => request.includeDatasheetInformation),
  ).toEqual([false])
})
