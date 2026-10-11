import { expect, test } from "bun:test"
import { Resvg } from "@resvg/resvg-js"
import type { PcbPath } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import { createImageDiff } from "tests/fixtures/compare-image-buffers"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderManualViaSpan } from "tests/fixtures/render-manual-via-span"

const cases = (["pcbPath", "pcbPaths"] as const).flatMap((api) =>
  ([2, 4, 10] as const).flatMap((layerCount) =>
    [undefined, false, true].map((allowBlindAndBuriedVias) => ({
      api,
      layerCount,
      allowBlindAndBuriedVias,
    })),
  ),
)
test.each(cases)("manual via physical span: %j", async (config) => {
  const { api, layerCount, allowBlindAndBuriedVias } = config
  // Expectations describe the board stack, independently of the via helper.
  const stack: LayerRef[] = [
    "top",
    ...Array.from(
      { length: layerCount - 2 },
      (_, i) => `inner${i + 1}` as LayerRef,
    ),
    "bottom",
  ]
  const deepLayer = stack[stack.length - 2]
  const signalLayers: LayerRef[] =
    layerCount === 2
      ? ["top", "bottom", "top"]
      : ["top", deepLayer, "top", "inner1", deepLayer, "top", "bottom", "top"]
  const transitions = signalLayers.slice(1).map((toLayer, i) => ({
    fromLayer: signalLayers[i],
    toLayer,
  }))
  const path: PcbPath = [
    "R1.pin2",
    ...transitions.flatMap(({ fromLayer, toLayer }, i) => [
      { x: i + 2, y: 0 },
      { x: i + 2, y: 0, via: true, fromLayer, toLayer },
      { x: i + 2, y: 0 },
    ]),
    "R2.pin1",
  ]
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board
      width={30}
      height={12}
      layers={layerCount}
      routeRemaining={false}
      allowBlindAndBuriedVias={allowBlindAndBuriedVias}
      pcbStyle={{ viaHoleDiameter: 0.3, viaPadDiameter: 0.7 }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        {...(api === "pcbPath" ? { pcbPath: path } : { pcbPaths: [path] })}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const vias = circuit.db.pcb_via.list()
  const route = circuit.db.pcb_trace.list().flatMap((trace) => trace.route)
  const expectedLayers = transitions.map(({ fromLayer, toLayer }) => {
    if (!allowBlindAndBuriedVias) return stack
    const from = stack.indexOf(fromLayer)
    const to = stack.indexOf(toLayer)
    return stack.slice(Math.min(from, to), Math.max(from, to) + 1)
  })
  const errors = json.filter((element) => element.type.includes("error"))
  let assertionsPassed = false
  try {
    // Check setup and logical transitions before the physical-span assertion.
    expect(errors).toEqual([])
    expect(vias).toHaveLength(transitions.length)
    expect(
      route
        .filter((point) => point.route_type === "via")
        .map((point) => [point.from_layer, point.to_layer]),
    ).toEqual(transitions.map(({ fromLayer, toLayer }) => [fromLayer, toLayer]))
    expect([
      ...new Set(
        route
          .filter((point) => point.route_type === "wire")
          .map((point) => point.layer),
      ),
    ]).toEqual([...new Set(signalLayers)])
    expect(vias.map((via) => [via.hole_diameter, via.outer_diameter])).toEqual(
      transitions.map(() => [0.3, 0.7]),
    )
    expect(vias.map((via) => [via.from_layer, via.to_layer])).toEqual(
      transitions.map(({ fromLayer, toLayer }) => [fromLayer, toLayer]),
    )
    // Occupancy is independent of from/to ordering, including reverse outer vias.
    expect(
      vias.map((via) =>
        [...via.layers].sort((a, b) => stack.indexOf(a) - stack.indexOf(b)),
      ),
    ).toEqual(expectedLayers)
    assertionsPassed = true
  } finally {
    // Both APIs are asserted independently; one picture represents their shared geometry.
    // Failed assertions still produce the actual snapshot without updating the baseline.
    if (
      api === "pcbPath" &&
      layerCount === 4 &&
      allowBlindAndBuriedVias === false
    ) {
      const svg = renderManualViaSpan({
        api,
        allowBlindAndBuriedVias,
        json,
        assertionsPassed,
      })
      const snapshotName = `${api}-manual-via-physical-span`
      const snapshotPath = `${import.meta.dir}/__snapshots__/${snapshotName}`
      await Bun.write(
        `${snapshotPath}.received.png`,
        new Resvg(svg).render().asPng(),
      )
      if (assertionsPassed) {
        await expect(svg).toMatchSvgSnapshot(import.meta.path, snapshotName)
      } else {
        // Never update the expected baseline from output with a failed assertion.
        await createImageDiff({
          reference: await Bun.file(`${snapshotPath}.snap.svg`).bytes(),
          current: Buffer.from(svg),
          diffPath: `${snapshotPath}.diff.png`,
          highlightColor: "#ff00ff",
        })
      }
    }
  }
})
