import { it, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"
import "../../../lib/register-catalogue"
import { Chip } from "../../../lib/components/normal-components/Chip"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

it("should assign a default name to an unnamed chip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<chip {...({} as any)} />)

  await circuit.render()

  const chip = circuit.selectOne("chip") as Chip
  expect(chip.name).toMatch(/^unnamed_chip\d+$/)

  expect(
    convertCircuitJsonToSchematicSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
