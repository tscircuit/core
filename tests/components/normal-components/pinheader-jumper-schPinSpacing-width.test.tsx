import { expect, it } from "bun:test"
import type { ReactElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Size = { width: number; height: number }

type ComponentSizeResult = {
  defaultSize: Size
  adjustedSize: Size
}

const getSchematicComponentSizes = async (
  component: ReactElement,
  adjustedComponent: ReactElement,
): Promise<ComponentSizeResult> => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {component}
      {adjustedComponent}
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

  return {
    defaultSize: getSizeForName("DEFAULT"),
    adjustedSize: getSizeForName("ADJUSTED"),
  }
}

it("pinheader schPinSpacing does not change schematic width", async () => {
  const { defaultSize, adjustedSize } = await getSchematicComponentSizes(
    <pinheader name="DEFAULT" pinCount={3} />,
    <pinheader name="ADJUSTED" pinCount={3} schPinSpacing={0.75} schY={-4} />,
  )

  expect(adjustedSize.width).toBeCloseTo(defaultSize.width)
  expect(adjustedSize.height).toBeGreaterThan(defaultSize.height)
})

it("jumper schPinSpacing does not change schematic width", async () => {
  const { defaultSize, adjustedSize } = await getSchematicComponentSizes(
    <jumper name="DEFAULT" pinCount={3} />,
    <jumper name="ADJUSTED" pinCount={3} schPinSpacing={0.75} schY={-4} />,
  )

  expect(adjustedSize.width).toBeCloseTo(defaultSize.width)
  expect(adjustedSize.height).toBeGreaterThan(defaultSize.height)
})
