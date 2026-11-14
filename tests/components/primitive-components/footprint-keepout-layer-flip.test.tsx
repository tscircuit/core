import { expect, test } from "bun:test"
import { Fragment } from "react"
import type { LayerRef } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit footprint keepout layers follow the emitted pads when the footprint flips", async () => {
  // Footprint-local points in mm, +X right, +Y up, +Z above, right-handed.
  // Board, group and chip translations produce board-world point coordinates;
  // compare emitted pads rather than reconstructing that transform here.
  const { circuit } = getTestFixture()
  const cases = (["top", "bottom"] as const).flatMap((originalLayer, row) =>
    (["top", "bottom"] as const).flatMap((layer, layerRow) =>
      [0, 90, 180, 270].map((rotation, column) => ({
        name: `U${row * 8 + layerRow * 4 + column + 1}`,
        originalLayer,
        layer,
        rotation,
        x: -18 + column * 12,
        y: 18 - (row * 2 + layerRow) * 12,
        mixedLayers: [originalLayer, "inner1", "inner2"] satisfies LayerRef[],
      })),
    ),
  )
  const authoredLayerArrays = cases.map(({ mixedLayers }) => [...mixedLayers])

  circuit.add(
    <board
      width={56}
      height={58}
      pcbX={3}
      pcbY={-2}
      layers={4}
      routingDisabled
      schematicDisabled
    >
      <pcbnotetext
        text="FOOTPRINT KEEPOUTS FOLLOW PAD LAYERS"
        pcbY={25}
        fontSize={1}
      />
      <group pcbX={2} pcbY={-1}>
        {cases.map((footprintCase) => (
          <Fragment key={footprintCase.name}>
            <chip
              name={footprintCase.name}
              layer={footprintCase.layer}
              pcbX={footprintCase.x}
              pcbY={footprintCase.y}
              pcbRotation={footprintCase.rotation}
              footprint={
                <footprint originalLayer={footprintCase.originalLayer}>
                  <smtpad
                    shape="rect"
                    width={3}
                    height={1}
                    pcbX={1.75}
                    pcbY={-0.5}
                    layer={footprintCase.originalLayer}
                    portHints={["1"]}
                    noSolderPaste
                  />
                  <keepout
                    shape="rect"
                    width={3}
                    height={1}
                    pcbX={1.75}
                    pcbY={-0.5}
                    layer={footprintCase.originalLayer}
                  />
                  <smtpad
                    shape="circle"
                    radius={0.4}
                    pcbX={-1.75}
                    pcbY={0.5}
                    layer={footprintCase.originalLayer}
                    portHints={["2"]}
                    noSolderPaste
                  />
                  <keepout
                    shape="circle"
                    radius={0.4}
                    pcbX={-1.75}
                    pcbY={0.5}
                    layers={[footprintCase.originalLayer]}
                  />
                  <keepout
                    shape="rect"
                    width={0.3}
                    height={0.3}
                    pcbY={2}
                    layers={footprintCase.mixedLayers}
                  />
                  <keepout
                    shape="rect"
                    width={0.4}
                    height={0.4}
                    pcbY={-2}
                    layers={["inner1", "inner2"]}
                  />
                  <keepout
                    shape="circle"
                    radius={0.2}
                    layers={["top", "inner1", "inner2", "bottom"]}
                  />
                </footprint>
              }
            />
            <pcbnotetext
              text={`${footprintCase.originalLayer} to ${footprintCase.layer} ${footprintCase.rotation}deg`}
              pcbX={footprintCase.x}
              pcbY={footprintCase.y - 4}
              fontSize={0.6}
            />
          </Fragment>
        ))}
      </group>
      <keepout
        shape="rect"
        width={0.6}
        height={0.6}
        pcbX={-23}
        pcbY={-25}
        layers={["bottom", "inner1", "top", "inner2"]}
      />
    </board>,
  )
  circuit.render()

  for (const footprintCase of cases) {
    const sourceComponent = circuit.db.source_component.getWhere({
      name: footprintCase.name,
    })!
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const pads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
    const rectPad = pads.find((pad) => pad.shape === "rect")!
    const circlePad = pads.find((pad) => pad.shape === "circle")!
    const keepouts = circuit.db.pcb_keepout
      .list()
      .filter(
        (keepout) => keepout.pcb_component_id === pcbComponent.pcb_component_id,
      )
    const rectangles = keepouts.filter((keepout) => keepout.shape === "rect")
    const rectKeepout = rectangles.find(
      (keepout) => keepout.width > 1 || keepout.height > 1,
    )!
    const circles = keepouts.filter((keepout) => keepout.shape === "circle")
    const circleKeepout = circles.find((keepout) => keepout.radius === 0.4)!
    expect(rectKeepout.center.x).toBeCloseTo(rectPad.x)
    expect(rectKeepout.center.y).toBeCloseTo(rectPad.y)
    expect(rectKeepout.width).toBeCloseTo(rectPad.width)
    expect(rectKeepout.height).toBeCloseTo(rectPad.height)
    expect(rectKeepout.layers).toEqual([rectPad.layer])
    expect(circleKeepout.center.x).toBeCloseTo(circlePad.x)
    expect(circleKeepout.center.y).toBeCloseTo(circlePad.y)
    expect(circleKeepout.layers).toEqual([circlePad.layer])
    expect(
      rectangles.find((keepout) => keepout.width === 0.3)?.layers.toSorted(),
    ).toEqual([rectPad.layer, "inner1", "inner2"].toSorted())
    expect(
      rectangles.find((keepout) => keepout.width === 0.4)?.layers.toSorted(),
    ).toEqual(["inner1", "inner2"])
    expect(
      circles.find((keepout) => keepout.radius === 0.2)?.layers.toSorted(),
    ).toEqual(["bottom", "inner1", "inner2", "top"])
  }
  expect(cases.map(({ mixedLayers }) => mixedLayers)).toEqual(
    authoredLayerArrays,
  )
  expect(
    circuit.db.pcb_keepout
      .list()
      .find((keepout) => !keepout.pcb_component_id)
      ?.layers.toSorted(),
  ).toEqual(["bottom", "inner1", "inner2", "top"])
  expect(
    circuit.db.source_failed_to_create_component_error.list(),
  ).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1400,
    height: 1400,
  })
})
