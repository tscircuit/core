import { it, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Stampboard } from "lib/components/normal-components/Stampboard"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should create a Stampboard component with correct properties", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <stampboard name="SB1" footprint="stampboard" />
    </board>,
  )

  circuit.render()

  const stampboard = circuit.selectOne("stampboard") as Stampboard

  expect(stampboard).not.toBeNull()
  expect(stampboard.props.name).toBe("SB1")
  expect(stampboard.props.footprint).toBe("stampboard")
  expect(stampboard.config.componentName).toBe("Stampboard")
  expect(stampboard.config.shouldRenderAsSchematicBox).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
