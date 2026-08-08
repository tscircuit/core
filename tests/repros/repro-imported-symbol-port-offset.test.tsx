import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

const ImportedFerriteBead = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    symbol={
      <symbol>
        <port
          name="pin1"
          pinNumber={1}
          aliases={["1"]}
          direction="left"
          schX={-0.508}
          schY={0}
          schStemLength={0.0762}
        />
        <port
          name="pin2"
          pinNumber={2}
          aliases={["2"]}
          direction="right"
          schX={0.508}
          schY={0}
          schStemLength={0.0762}
        />
        <schematicpath
          svgPath="M -0.428752 0 A 0.1016 0.09906 0 1 0 -0.226568 0"
          strokeWidth={0.0254}
        />
        <schematicpath
          svgPath="M -0.21336 0 A 0.1016 0.09906 0 1 0 -0.011176 0"
          strokeWidth={0.0254}
        />
        <schematicpath
          svgPath="M 0.001778 0 A 0.1016 0.09906 0 1 0 0.203962 0"
          strokeWidth={0.0254}
        />
        <schematicpath
          svgPath="M 0.22098 0 A 0.1016 0.09906 0 1 0 0.423418 0"
          strokeWidth={0.0254}
        />
      </symbol>
    }
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX={-0.7}
          pcbY={0}
          width={0.8}
          height={0.86}
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX={0.7}
          pcbY={0}
          width={0.8}
          height={0.86}
          shape="rect"
        />
      </footprint>
    }
    {...props}
  />
)

test("imported symbol ports and stems follow the host component offset", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm">
      <ImportedFerriteBead
        name="L1"
        schX={4}
        schY={2}
        connections={{ pin1: "net.IN", pin2: "net.OUT" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
    grid: { cellSize: 0.5, labelCells: true },
  })

  const sourceComponent = circuit.db.source_component.getWhere({ name: "L1" })!
  const sourcePorts = circuit.db.source_port.list({
    source_component_id: sourceComponent.source_component_id,
  })
  const sourcePortIds = new Set(sourcePorts.map((port) => port.source_port_id))
  const schematicPorts = circuit.db.schematic_port
    .list()
    .filter((port) => sourcePortIds.has(port.source_port_id))
    .sort((a, b) => a.center.x - b.center.x)
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })!
  const stems = circuit.db.schematic_line.list({
    schematic_component_id: schematicComponent.schematic_component_id,
  })

  expect(sourcePorts).toHaveLength(2)
  expect(schematicPorts).toHaveLength(2)
  expect(schematicPorts.map((port) => port.center)).toEqual([
    { x: 3.492, y: 2 },
    { x: 4.508, y: 2 },
  ])
  expect(schematicPorts.every((port) => port.is_connected)).toBe(true)
  expect(stems).toHaveLength(2)
})
