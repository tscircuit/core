import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { importSnippet } from "@tscircuit/import-snippet"
import * as tscircuitCore from "lib"

test("elkjs RP2040", async () => {
  const { circuit } = getTestFixture()

  const Snippet = await importSnippet("ShiboSoftwareDev/ESP32_module", {
    dependencies: { "@tscircuit/core": tscircuitCore },
  })
  circuit.add(<Snippet schAutoLayoutEnabled={true} />)

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
})
