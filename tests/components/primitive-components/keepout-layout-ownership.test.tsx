import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint keepouts follow their pads through component and group layout", async () => {
  for (const layout of ["direct", "grid", "flex", "nested_grid"] as const) {
    const { circuit } = getTestFixture()
    const cases = (["top", "bottom"] as const).flatMap((layer) =>
      [0, 90, 180, 270].map((pcbRotation) => ({ layer, pcbRotation })),
    )
    const chips = cases.map(({ layer, pcbRotation }, index) => (
      <chip
        key={`${layer}-${pcbRotation}`}
        name={`U${index + 1}`}
        layer={layer}
        pcbRotation={pcbRotation}
        {...(layout === "direct"
          ? { pcbX: (index % 4) * 20 - 30, pcbY: index < 4 ? 16 : -16 }
          : {})}
        footprint={
          <footprint>
            {/* Footprint-local points in mm, right-handed: +X right, +Y top,
                +Z above. Co-located pads provide independent emitted centers. */}
            <smtpad
              shape="rect"
              pcbX={3}
              pcbY={2}
              width={4}
              height={2}
              portHints={["pin1"]}
            />
            <keepout
              shape="rect"
              pcbX={3}
              pcbY={2}
              width={4}
              height={2}
              layers={["top", "bottom"]}
              excludeRefs={[`.U${index + 1}`]}
            />
            <smtpad
              shape="circle"
              pcbX={-2}
              pcbY={-1}
              radius={1}
              portHints={["pin2"]}
            />
            <keepout
              shape="circle"
              pcbX={-2}
              pcbY={-1}
              radius={1}
              layers={["top", "bottom"]}
              excludeRefs={[`.U${index + 1}`]}
              warningOnly
              allowTraces
            />
            <pcbnotetext
              text={`${layer} ${pcbRotation}°`}
              pcbY={6}
              fontSize={1}
            />
          </footprint>
        }
      />
    ))

    const innerGrid = (
      <group name="inner" pcbGrid pcbGridCols={4} pcbGridGap={5}>
        {chips}
      </group>
    )
    circuit.add(
      <board width={100} height={60} routingDisabled schematicDisabled>
        <group
          name="layout"
          pcbX={12}
          pcbY={-7}
          pcbGrid={layout === "grid" || layout === "nested_grid"}
          pcbGridCols={layout === "nested_grid" ? 2 : 4}
          pcbGridGap={10}
          pcbFlex={layout === "flex"}
          pcbFlexGap={5}
        >
          {layout === "nested_grid" ? (
            <Fragment>
              {innerGrid}
              <pinheader name="J1" pinCount={2} pitch="2.54mm" />
            </Fragment>
          ) : (
            chips
          )}
        </group>
        <keepout shape="circle" radius={1} pcbX={46} pcbY={27} />
        <pcbnotetext
          text={`${layout}: RECT AND CIRCLE KEEPOUTS MATCH PADS`}
          pcbY={27}
          fontSize={1.5}
        />
        <pcbnotetext
          text="TOP / BOTTOM: 0, 90, 180, 270 DEGREES"
          pcbY={23}
          fontSize={1.5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    // Compare board-world points/extents in mm (+X right, +Y top, +Z above,
    // right-handed) against the pads actually moved by the layout utilities.
    const keepouts = circuit.db.pcb_keepout.list()
    const rectPads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "rect")
    const circlePads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "circle")
    for (let index = 0; index < cases.length; index++) {
      const rectPad = rectPads[index]
      const circlePad = circlePads[index]
      expect(keepouts[index * 2]).toMatchObject({
        shape: "rect",
        center: { x: rectPad.x, y: rectPad.y },
        width: rectPad.width,
        height: rectPad.height,
        pcb_component_id: rectPad.pcb_component_id,
        excluded_pcb_component_ids: [rectPad.pcb_component_id],
      })
      expect(keepouts[index * 2 + 1]).toMatchObject({
        shape: "circle",
        center: { x: circlePad.x, y: circlePad.y },
        radius: 1,
        pcb_component_id: circlePad.pcb_component_id,
        warning_only: true,
        allow_traces: true,
      })
    }
    expect(keepouts.at(-1)).toMatchObject({ center: { x: 46, y: 27 } })
    expect(keepouts.at(-1)).not.toHaveProperty("pcb_component_id")
    await expect(circuit).toMatchPcbSnapshot(
      `${import.meta.dir}/keepout-layout-ownership-${layout}`,
    )
  }
})
