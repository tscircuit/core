import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { importSnippet } from "@tscircuit/import-snippet"
import * as tscircuitCore from "lib"

test("elkjs Grid of LEDs", async () => {
  const { circuit } = getTestFixture()

  const Snippet = await importSnippet("ShiboSoftwareDev/contribution-board", {
    dependencies: { "@tscircuit/core": tscircuitCore },
  })
  circuit.add(<Snippet schAutoLayoutEnabled={true} />)

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toMatchSchematicSnapshot(import.meta.path)
})
