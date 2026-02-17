import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A simple cached subcircuit with a resistor and capacitor.
 */
function SimpleSubcircuit({
  name,
  resistance = "1k",
  capacitance = "100nF",
  ...props
}: {
  name: string
  resistance?: string
  capacitance?: string
} & Record<string, any>) {
  return (
    <subcircuit name={name} {...props}>
      <resistor name="R1" resistance={resistance} footprint="0402" pcbX={0} />
      <capacitor
        name="C1"
        capacitance={capacitance}
        footprint="0402"
        pcbY={2}
      />
      <trace from=".R1 .pin1" to=".C1 .pin1" />
    </subcircuit>
  )
}

/**
 * A subcircuit with inline footprint.
 */
function InlineFootprintSubcircuit({
  name,
  holeDiameter = "1mm",
  ...props
}: {
  name: string
  holeDiameter?: string
} & Record<string, any>) {
  return (
    <subcircuit name={name} {...props}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      <chip
        name="U1"
        footprint={
          <footprint>
            <platedhole
              name="H1"
              shape="circle"
              holeDiameter={holeDiameter}
              outerDiameter="2mm"
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="0"
            />
            <platedhole
              name="H2"
              portHints={["pin2"]}
              shape="circle"
              holeDiameter={holeDiameter}
              outerDiameter="2mm"
              pcbX="3mm"
              pcbY="0"
            />
          </footprint>
        }
      />
      <trace from=".R1 .pin1" to=".U1 .pin1" />
    </subcircuit>
  )
}

test("cache invalidation - different resistance values produce different cache entries", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      {/* Three identical subcircuits - should share cache */}
      <SimpleSubcircuit
        name="Same1"
        resistance="1k"
        _subcircuitCachingEnabled
        pcbX={-20}
      />
      <SimpleSubcircuit
        name="Same2"
        resistance="1k"
        _subcircuitCachingEnabled
        pcbX={0}
      />
      <SimpleSubcircuit
        name="Same3"
        resistance="1k"
        _subcircuitCachingEnabled
        pcbX={20}
      />

      {/* Subcircuit with different resistance - should NOT share cache */}
      <SimpleSubcircuit
        name="DiffRes"
        resistance="2k"
        _subcircuitCachingEnabled
        pcbX={40}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Should have 2 cache entries:
  // 1. SimpleSubcircuit with 1k (shared by Same1, Same2, Same3)
  // 2. SimpleSubcircuit with 2k (DiffRes)
  expect(circuit.cachedSubcircuits!.size).toBe(2)

  // Verify all 4 subcircuits rendered correctly
  expect(circuit.db.source_component.list().length).toBe(8) // 4 × 2
  expect(circuit.db.pcb_trace.list().length).toBe(4) // 4 × 1
})

test("cache invalidation - different capacitance values produce different cache entries", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      {/* Two with same capacitance */}
      <SimpleSubcircuit
        name="Cap1"
        capacitance="100nF"
        _subcircuitCachingEnabled
        pcbX={-20}
      />
      <SimpleSubcircuit
        name="Cap2"
        capacitance="100nF"
        _subcircuitCachingEnabled
        pcbX={0}
      />

      {/* Two with different capacitance */}
      <SimpleSubcircuit
        name="Cap3"
        capacitance="10uF"
        _subcircuitCachingEnabled
        pcbX={20}
      />
      <SimpleSubcircuit
        name="Cap4"
        capacitance="10uF"
        _subcircuitCachingEnabled
        pcbX={40}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Should have 2 cache entries (one for each capacitance value)
  expect(circuit.cachedSubcircuits!.size).toBe(2)

  // Verify all 4 subcircuits rendered correctly
  expect(circuit.db.source_component.list().length).toBe(8)
})

test("cache invalidation - different inline footprint dimensions produce different cache entries", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="80mm" height="20mm">
      {/* Two with same hole diameter */}
      <InlineFootprintSubcircuit
        name="Hole1"
        holeDiameter="1mm"
        _subcircuitCachingEnabled
        pcbX={-30}
      />
      <InlineFootprintSubcircuit
        name="Hole2"
        holeDiameter="1mm"
        _subcircuitCachingEnabled
        pcbX={-10}
      />

      {/* Two with different hole diameter */}
      <InlineFootprintSubcircuit
        name="Hole3"
        holeDiameter="1.5mm"
        _subcircuitCachingEnabled
        pcbX={10}
      />
      <InlineFootprintSubcircuit
        name="Hole4"
        holeDiameter="1.5mm"
        _subcircuitCachingEnabled
        pcbX={30}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Should have 2 cache entries (one for each hole diameter)
  expect(circuit.cachedSubcircuits!.size).toBe(2)

  // Verify all 4 subcircuits rendered correctly
  expect(circuit.db.source_component.list().length).toBe(8) // 4 × 2

  // Verify plated holes have correct dimensions
  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles.length).toBe(8) // 4 subcircuits × 2 holes each

  const smallHoles = platedHoles.filter(
    (h) => "hole_diameter" in h && h.hole_diameter === 1,
  )
  const largeHoles = platedHoles.filter(
    (h) => "hole_diameter" in h && h.hole_diameter === 1.5,
  )
  expect(smallHoles.length).toBe(4) // 2 subcircuits × 2 holes
  expect(largeHoles.length).toBe(4) // 2 subcircuits × 2 holes
})

test("inline footprint children produce consistent hashes across instances", async () => {
  const { circuit } = getTestFixture()

  // Create multiple subcircuits with identical inline footprints
  // Each JSX invocation creates new React element objects, but they should hash the same
  circuit.add(
    <board width="80mm" height="20mm">
      <InlineFootprintSubcircuit
        name="Inline1"
        _subcircuitCachingEnabled
        pcbX={-30}
      />
      <InlineFootprintSubcircuit
        name="Inline2"
        _subcircuitCachingEnabled
        pcbX={-10}
      />
      <InlineFootprintSubcircuit
        name="Inline3"
        _subcircuitCachingEnabled
        pcbX={10}
      />
      <InlineFootprintSubcircuit
        name="Inline4"
        _subcircuitCachingEnabled
        pcbX={30}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // All 4 subcircuits have identical inline footprints, so they should share 1 cache entry
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify all rendered correctly
  expect(circuit.db.source_component.list().length).toBe(8) // 4 × 2
  expect(circuit.db.pcb_trace.list().length).toBe(4) // 4 × 1

  // Verify the plated holes were created correctly for each subcircuit
  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles.length).toBe(8) // 4 subcircuits × 2 plated holes each
})

test("position props are excluded from hash - same content at different positions shares cache", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="100mm" height="100mm">
      {/* All at different positions but same content */}
      <SimpleSubcircuit
        name="Pos1"
        _subcircuitCachingEnabled
        pcbX={-40}
        pcbY={-40}
      />
      <SimpleSubcircuit
        name="Pos2"
        _subcircuitCachingEnabled
        pcbX={40}
        pcbY={-40}
      />
      <SimpleSubcircuit
        name="Pos3"
        _subcircuitCachingEnabled
        pcbX={-40}
        pcbY={40}
      />
      <SimpleSubcircuit
        name="Pos4"
        _subcircuitCachingEnabled
        pcbX={40}
        pcbY={40}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // All 4 should share the same cache entry despite different positions
  expect(circuit.cachedSubcircuits!.size).toBe(1)

  // Verify positions are actually different in the output
  const smtpads = circuit.db.pcb_smtpad.list()
  const uniquePositions = new Set(
    smtpads
      .filter((p) => "x" in p && "y" in p)
      .map((p) => `${(p as any).x},${(p as any).y}`),
  )
  // Should have multiple unique positions (not all at the same spot)
  expect(uniquePositions.size).toBeGreaterThan(4)
})
