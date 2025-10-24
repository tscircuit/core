import { expect, it } from "bun:test"
import type { ReactElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Size = { width: number; height: number }

const renderComponentsAndGetSizeLookup = async (
  ...components: ReactElement[]
) => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {components}
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponents = circuit.db.source_component.list()
  const schematicComponents = circuit.db.schematic_component.list()

  const getSizeForName = (name: string): Size => {
    const source = sourceComponents.find((c) => c.name === name)
    if (!source) throw new Error(`Missing source component for ${name}`)

    const schematic = schematicComponents.find(
      (c) => c.source_component_id === source.source_component_id,
    )
    if (!schematic) throw new Error(`Missing schematic component for ${name}`)

    return schematic.size
  }

  return { circuit, getSizeForName }
}

it("pinheader and jumper schPinSpacing does not change schematic width", async () => {
  const { circuit, getSizeForName } = await renderComponentsAndGetSizeLookup(
    <pinheader key="pinheader-default" name="PINHEADER_DEFAULT" pinCount={3} />,
    <pinheader
      key="pinheader-adjusted"
      name="PINHEADER_ADJUSTED"
      pinCount={3}
      schPinSpacing={0.75}
      schY={-4}
    />,
    <jumper key="jumper-default" name="JUMPER_DEFAULT" pinCount={3} />,
    <jumper
      key="jumper-adjusted"
      name="JUMPER_ADJUSTED"
      pinCount={3}
      schPinSpacing={0.75}
      schY={-4}
    />,
  )

  const pinheaderDefault = getSizeForName("PINHEADER_DEFAULT")
  const pinheaderAdjusted = getSizeForName("PINHEADER_ADJUSTED")
  const jumperDefault = getSizeForName("JUMPER_DEFAULT")
  const jumperAdjusted = getSizeForName("JUMPER_ADJUSTED")

  expect(pinheaderAdjusted.width).toBeCloseTo(pinheaderDefault.width)
  expect(pinheaderAdjusted.height).toBeGreaterThan(pinheaderDefault.height)

  expect(jumperAdjusted.width).toBeCloseTo(jumperDefault.width)
  expect(jumperAdjusted.height).toBeGreaterThan(jumperDefault.height)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
