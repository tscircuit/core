import { expect, test } from "bun:test"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

/**
 * A subcircuit with KiCad footprint and traces that takes time to render.
 * Used to benchmark caching performance.
 */
function KicadSubcircuit({
  name,
  ...props
}: { name: string } & Record<string, any>) {
  return (
    <subcircuit name={name} {...props}>
      <resistor
        name="R1"
        footprint="kicad:Resistor_SMD.pretty/R_0402_1005Metric"
        resistance="1k"
        pcbX={0}
        pcbY={0}
      />
      <chip
        name="U1"
        footprint={
          <footprint>
            <platedhole
              name="MP1"
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="2mm"
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="0"
            />
            <platedhole
              name="MP2"
              portHints={["pin2"]}
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="2mm"
              pcbX="3mm"
              pcbY="0"
            />
          </footprint>
        }
      />
      <trace from=".R1 > .pin1" to=".U1 > .pin1" width="0.8mm" />
      <trace from=".R1 > .pin2" to=".U1 > .pin2" width="0.8mm" />
    </subcircuit>
  )
}

test("subcircuit caching benchmark", async () => {
  const { url: footprintServerUrl } = getTestFootprintServer(
    external0402Footprint,
  )

  const platformConfig = {
    footprintLibraryMap: {
      kicad: async (footprintName: string) => {
        const url = `${footprintServerUrl}/${footprintName}.circuit.json`
        const res = await fetch(url)
        return { footprintCircuitJson: await res.json() }
      },
    },
  }

  // ============================================================
  // Test 1: Single subcircuit (baseline)
  // ============================================================
  const { circuit: circuit1 } = getTestFixture({ platform: platformConfig })

  const start1 = performance.now()
  circuit1.add(
    <board width="20mm" height="10mm">
      <KicadSubcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0} />
    </board>,
  )
  await circuit1.renderUntilSettled()
  const time1 = performance.now() - start1

  expect(circuit1.db.source_component.list().length).toBe(2)
  expect(circuit1.db.pcb_trace.list().length).toBe(2)

  // ============================================================
  // Test 2: Panel with 20 cached subcircuits
  // ============================================================
  const { circuit: circuit2 } = getTestFixture({ platform: platformConfig })

  const start2 = performance.now()

  const boardWidth = 15
  const boardHeight = 8
  const numBoards = 20

  circuit2.add(
    <panel width={100} height={100} layoutMode="grid">
      {Array.from({ length: numBoards }, (_, i) => (
        <board
          key={`board-${i}`}
          width={`${boardWidth}mm`}
          height={`${boardHeight}mm`}
        >
          <KicadSubcircuit
            name={`S${i}`}
            _subcircuitCachingEnabled
            pcbX={0}
            pcbY={0}
          />
        </board>
      ))}
    </panel>,
  )
  await circuit2.renderUntilSettled()
  expect(circuit2).toMatchPcbSnapshot(import.meta.path + "-panel")
  const time2 = performance.now() - start2

  // Should have 20 * 2 = 40 source components
  expect(circuit2.db.source_component.list().length).toBe(40)
  // Should have 20 * 2 = 40 traces
  expect(circuit2.db.pcb_trace.list().length).toBe(40)
  // Should only have 1 cached subcircuit (all 20 share the same cache)
  expect(circuit2.cachedSubcircuits!.size).toBe(1)

  // ============================================================
  // Test 3: 24 cached subcircuits nested at different levels
  // Total: 5 direct + 2 in G1 + 3 in G2 + 4 in G32 + 4 in G3 + 6 in Deep = 24
  // ============================================================
  const { circuit: circuit3 } = getTestFixture({ platform: platformConfig })

  const start3 = performance.now()
  circuit3.add(
    <board width="200mm" height="200mm">
      {/* Direct children: 5 subcircuits */}
      <KicadSubcircuit
        name="Direct1"
        _subcircuitCachingEnabled
        pcbX={-80}
        pcbY={-80}
      />
      <KicadSubcircuit
        name="Direct2"
        _subcircuitCachingEnabled
        pcbX={-60}
        pcbY={-80}
      />
      <KicadSubcircuit
        name="Direct3"
        _subcircuitCachingEnabled
        pcbX={-40}
        pcbY={-80}
      />
      <KicadSubcircuit
        name="Direct4"
        _subcircuitCachingEnabled
        pcbX={-20}
        pcbY={-80}
      />
      <KicadSubcircuit
        name="Direct5"
        _subcircuitCachingEnabled
        pcbX={0}
        pcbY={-80}
      />

      {/* Nested in group G1: 2 subcircuits */}
      <group name="G1" pcbX={-60} pcbY={-40}>
        <KicadSubcircuit
          name="G1S1"
          _subcircuitCachingEnabled
          pcbX={0}
          pcbY={0}
        />
        <KicadSubcircuit
          name="G1S2"
          _subcircuitCachingEnabled
          pcbX={20}
          pcbY={0}
        />
      </group>

      {/* Nested in group G2 with inner group: 3 subcircuits */}
      <group name="G2" pcbX={20} pcbY={-40}>
        <KicadSubcircuit
          name="G2S1"
          _subcircuitCachingEnabled
          pcbX={0}
          pcbY={0}
        />
        <group name="G2Inner" pcbX={20} pcbY={0}>
          <KicadSubcircuit
            name="G2InnerS1"
            _subcircuitCachingEnabled
            pcbX={0}
            pcbY={0}
          />
          <KicadSubcircuit
            name="G2InnerS2"
            _subcircuitCachingEnabled
            pcbX={20}
            pcbY={0}
          />
        </group>
      </group>

      {/* Nested in group G3: 4 subcircuits */}
      <subcircuit _subcircuitCachingEnabled name="G32" pcbX={60} pcbY={0}>
        <KicadSubcircuit
          name="G3S12"
          _subcircuitCachingEnabled
          pcbX={0}
          pcbY={0}
        />
        <KicadSubcircuit
          name="G3S22"
          _subcircuitCachingEnabled
          pcbX={20}
          pcbY={0}
        />
        <KicadSubcircuit
          name="G3S32"
          _subcircuitCachingEnabled
          pcbX={40}
          pcbY={0}
        />
        <KicadSubcircuit
          name="G3S42"
          _subcircuitCachingEnabled
          pcbX={60}
          pcbY={0}
        />
      </subcircuit>
      <subcircuit _subcircuitCachingEnabled name="G3" pcbX={-30} pcbY={0}>
        <KicadSubcircuit
          name="G3S1"
          _subcircuitCachingEnabled
          pcbX={0}
          pcbY={0}
        />
        <KicadSubcircuit
          name="G3S2"
          _subcircuitCachingEnabled
          pcbX={40}
          pcbY={0}
        />
        <KicadSubcircuit
          name="G3S3"
          _subcircuitCachingEnabled
          pcbX={80}
          pcbY={0}
        />
        <KicadSubcircuit
          name="G3S4"
          _subcircuitCachingEnabled
          pcbX={120}
          pcbY={0}
        />
      </subcircuit>

      {/* Deeply nested in groups: 6 subcircuits */}
      <group name="Deep" pcbX={-60} pcbY={40}>
        <group name="DeepLevel1" pcbX={0} pcbY={0}>
          <group name="DeepLevel2" pcbX={0} pcbY={0}>
            <KicadSubcircuit
              name="DeepS1"
              _subcircuitCachingEnabled
              pcbX={0}
              pcbY={0}
            />
            <KicadSubcircuit
              name="DeepS2"
              _subcircuitCachingEnabled
              pcbX={40}
              pcbY={0}
            />
            <KicadSubcircuit
              name="DeepS3"
              _subcircuitCachingEnabled
              pcbX={80}
              pcbY={0}
            />
            <KicadSubcircuit
              name="DeepS4"
              _subcircuitCachingEnabled
              pcbX={120}
              pcbY={0}
            />
            <KicadSubcircuit
              name="DeepS5"
              _subcircuitCachingEnabled
              pcbX={140}
              pcbY={0}
            />
            <KicadSubcircuit
              name="DeepS6"
              _subcircuitCachingEnabled
              pcbX={100}
              pcbY={0}
            />
          </group>
        </group>
      </group>
    </board>,
  )
  await circuit3.renderUntilSettled()
  expect(circuit3).toMatchPcbSnapshot(import.meta.path + "-nested")
  const time3 = performance.now() - start3

  // 24 subcircuits × 2 components each = 48 source components
  expect(circuit3.db.source_component.list().length).toBe(48)
  // 24 subcircuits × 2 traces each = 48 traces
  expect(circuit3.db.pcb_trace.list().length).toBe(48)
  // Should have 3 cached subcircuits: KicadSubcircuit, G32, and G3
  expect(circuit3.cachedSubcircuits!.size).toBe(3)

  // ============================================================
  // Log timing results
  // ============================================================
  console.log("\n=== Subcircuit Caching Benchmark Results ===")
  console.log(`Test 1 - Single subcircuit (baseline): ${time1.toFixed(2)}ms`)
  console.log(
    `Test 2 - Panel with 20 cached subcircuits: ${time2.toFixed(2)}ms`,
  )
  console.log(`Test 3 - 20 nested cached subcircuits: ${time3.toFixed(2)}ms`)
  console.log(
    `\nSpeedup factor (panel vs 20x baseline): ${((time1 * 20) / time2).toFixed(2)}x`,
  )
  console.log(
    `Speedup factor (nested vs 24x baseline): ${((time1 * 24) / time3).toFixed(2)}x`,
  )
  console.log("=============================================\n")

  // Verify caching provides meaningful speedup
  // With caching, 20 subcircuits should take much less than 20x the single subcircuit time
  // We expect at least 2x speedup (being conservative due to test variability)
  const expectedMaxTime = time1 * 10 // Should be much faster than 10x baseline
  expect(time2).toBeLessThan(expectedMaxTime)
  expect(time3).toBeLessThan(expectedMaxTime)
})
