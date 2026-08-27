import { expect, test } from "bun:test"
import { getAutoroutedViaRenderMetadata } from "lib/components/primitive-components/Group/get-autorouted-via-render-metadata"

const viaRenderOptions = {
  defaultHoleDiameter: 0.3,
  defaultOuterDiameter: 0.6,
  layerCount: 4,
  allowBlindAndBuriedVias: true,
}

test("reversed via spans have the same normalized logical key", () => {
  const forwardVia = getAutoroutedViaRenderMetadata({
    pcbTraceId: "shared_trace",
    point: {
      route_type: "via",
      x: 1,
      y: 2,
      from_layer: "top",
      to_layer: "inner1",
      via_hole_diameter: 0.2,
      via_diameter: 0.4,
      layers: ["top", "inner1"],
    },
    ...viaRenderOptions,
  })
  const reversedVia = getAutoroutedViaRenderMetadata({
    pcbTraceId: "shared_trace",
    point: {
      route_type: "via",
      x: 1,
      y: 2,
      from_layer: "inner1",
      to_layer: "top",
      hole_diameter: 0.2,
      outer_diameter: 0.4,
      layers: ["inner1", "top"],
    },
    ...viaRenderOptions,
  })

  expect(forwardVia.logicalKey).toBe(reversedVia.logicalKey)
  expect(forwardVia.layers).toEqual(["top", "inner1"])
  expect(reversedVia.layers).toEqual(["top", "inner1"])
})
