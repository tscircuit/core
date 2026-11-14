import { expect, test } from "bun:test"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { InvalidProps } from "lib/errors/InvalidProps"

test("pcbtrace rejects malformed tagged points and invalid Circuit JSON metadata", () => {
  for (const route of [
    [{ route_type: "wire", x: 0, y: 0, layer: "top" }],
    [{ route_type: "via", x: 0, y: 0, from_layer: "top" }],
    [{ route_type: "unknown", x: 0, y: 0 }],
    [{ x: 0, y: 0, via: true }],
    [{ x: 0, y: 0, to_layer: "bottom" }],
    [{ x: "invalid", y: 0 }],
  ]) {
    expect(() => new PcbTrace({ route } as any)).toThrow(InvalidProps)
  }
  expect(
    () =>
      new PcbTrace({
        layer: "typo",
        route: [{ route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 }],
      } as any),
  ).toThrow(InvalidProps)
  expect(
    () =>
      new PcbTrace({
        source_trace_id: 42,
        route: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      } as any),
  ).toThrow(InvalidProps)
})
