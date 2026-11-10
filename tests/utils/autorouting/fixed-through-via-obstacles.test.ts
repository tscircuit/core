import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

// Board-world millimeters: +X right, +Y up, +Z above; all coordinates are points.
test("saved via obstacles cover the physical barrel on later routing phases", async () => {
  const stack = [
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "bottom",
  ]
  const scenarios = [
    {
      label: "Default through via",
      allow: undefined,
      physical: undefined,
      expected: stack,
    },
    {
      label: "Through overrides short metadata",
      allow: false,
      physical: stack.slice(0, 4),
      expected: stack,
    },
    {
      label: "Opt-in blind via",
      allow: true,
      physical: undefined,
      expected: stack.slice(0, 4),
    },
    {
      label: "Explicit full barrel with opt-in",
      allow: true,
      physical: stack,
      expected: stack,
    },
  ]
  const diagrams: string[] = []
  for (const [column, scenario] of scenarios.entries()) {
    const input: SimpleRouteJson = {
      layerCount: 8,
      minTraceWidth: 0.06,
      bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
      allowBlindAndBuriedVias: scenario.allow,
      obstacles: [],
      connections: [],
      traces: [
        {
          type: "pcb_trace",
          pcb_trace_id: "saved_usb",
          connection_name: "usb_dm",
          route: [
            { route_type: "wire", x: -1, y: 0, width: 0.06, layer: "top" },
            {
              route_type: "via",
              x: 0,
              y: 0,
              from_layer: "top",
              to_layer: "inner3",
              via_diameter: 0.2,
              layers: scenario.physical,
            },
            { route_type: "wire", x: 1, y: 0, width: 0.06, layer: "inner3" },
          ],
        },
      ],
    }
    const before = structuredClone(input)
    const output = withFixedTraces(input, new Set(["saved_usb"]))
    const barrel = output.obstacles.find((o) => o.layers.length > 1)!
    expect(barrel.layers).toEqual(scenario.expected)
    expect(barrel.width).toBe(0.2)
    expect(barrel.connectedTo).toContain("usb_dm")
    expect(output.traces).toEqual([])
    expect(input).toEqual(before)
    const x = 20 + column * 240
    diagrams.push(
      `<text x="${x}" y="65" font-size="12">${scenario.label}</text>`,
    )
    for (const [row, layer] of stack.entries()) {
      const y = 100 + row * 30
      const occupied = barrel.layers.includes(layer)
      diagrams.push(
        `<text x="${x}" y="${y + 4}" font-size="12">${layer}</text><line x1="${x + 65}" x2="${x + 205}" y1="${y}" y2="${y}" stroke="#536678"/><rect x="${x + 125}" y="${y - 10}" width="20" height="20" fill="${occupied ? "#ef8b36" : "#253447"}"/>`,
      )
    }
  }
  await expect(
    `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="390" viewBox="0 0 980 390"><rect width="980" height="390" fill="#101b29"/><g fill="#e4edf6" font-family="sans-serif"><text x="20" y="30" font-size="18">Saved USB via: logical top to inner3; orange = physical obstacle</text>${diagrams.join("")}<text x="20" y="370" font-size="13">Later routing must avoid the orange barrel on every occupied copper layer.</text></g></svg>`,
  ).toMatchSvgSnapshot(import.meta.path)
})
