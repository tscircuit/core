import { describe, it, expect } from "bun:test" // or 'vitest' if your repo uses it
import * as React from "react"
import { normalizeSymbolProp } from "../../../lib/utils/schematic/normalizeSymbolProp"

// If TS complains about intrinsic JSX tags, keep this tiny ambient:
declare global {
  namespace JSX {
    interface IntrinsicElements {
      symbol: any
      line: any
      rect: any
      circle: any
      arc: any
      text: any
    }
  }
}

describe("normalizeSymbolProp", () => {
  it("returns symbol_name for a string alias", () => {
    const out = normalizeSymbolProp("resistor")
    // We don’t assume discriminated union; just check presence
    expect("symbol_name" in out).toBe(true)
    expect((out as any).symbol_name).toBe("resistor")
  })

  it("returns inline symbol with primitives for <symbol>…</symbol>", () => {
    const out = normalizeSymbolProp(
      <symbol width={30} height={10}>
        <line x1={0} y1={5} x2={12} y2={5} />
        <rect x={12} y={1} width={6} height={8} />
        <text x={2} y={9.5} fontSize={2}>
          R
        </text>
      </symbol>,
    )
    expect("symbol" in out).toBe(true)
    const sym = (out as any).symbol
    expect(sym.width).toBe(30)
    expect(sym.height).toBe(10)
    expect(Array.isArray(sym.primitives)).toBe(true)
    expect(sym.primitives.length).toBe(3)
    expect(sym.primitives[0].kind).toBe("line")
    expect(sym.primitives[1].kind).toBe("rect")
    expect(sym.primitives[2].kind).toBe("text")
  })

  it("ignores empty/invalid values", () => {
    expect(normalizeSymbolProp(undefined)).toEqual({})
    expect(normalizeSymbolProp(null)).toEqual({})
    // wrong root tag:
    expect(() => normalizeSymbolProp((<div />) as any)).toThrow()
  })
})
