import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Comprehensive test for subcircuit caching with prop hashing.
 *
 * Grid layout — each COLUMN is a unique subcircuit structure, each ROW within
 * a column is an identical copy (cache hit) or variant.
 *
 * Col A: R1(1k)+C1(100nF)+trace — cached
 *   Row 0: S1  (cache MISS, first render)
 *   Row 1: S2  (cache HIT, identical)
 *   Row 2: S6  (cache HIT, different pcb position)
 *   Row 3: S7  (cache HIT, different sch position)
 *
 * Col B: R1(2k) — cached
 *   Row 0: S3  (cache MISS)
 *   Row 1: S5  (cache HIT)
 *   Row 2: S11 (cache HIT)
 *
 * Col C: R1(1k)+C1(100nF)+trace — NO caching
 *   Row 0: S4  (normal render, no caching)
 *   Row 1: S9  (normal render, no caching)
 *
 * Col D: R1(1k)+C1(220nF)+trace — cached (different cap)
 *   Row 0: S8  (cache MISS)
 *
 * Col E: R1(1k,0805)+C1(100nF)+trace — cached (different footprint)
 *   Row 0: S10 (cache MISS)
 *
 * Col F: chip(LED1)+R1(1k)+trace — cached
 *   Row 0: S12 (cache MISS)
 *   Row 1: S13 (cache HIT)
 */
test("subcircuit caching with identical and unique props", async () => {
  const { circuit } = getTestFixture()

  // Grid geometry
  const colX = [-32, -19, -6, 7, 20, 33] // columns A–F
  const rowSpacing = 12
  const rowY = (r: number) => 28 - r * rowSpacing // row 0 at top, row 3 at bottom
  const labelOffY = 5 // text above each subcircuit rect (positive Y = up in PCB)
  const rectW = 10
  const rectH = 9

  // Helper to add a silkscreen label
  const Label = ({
    text,
    pcbX,
    pcbY,
  }: { text: string; pcbX: number; pcbY: number }) => (
    <>
      <silkscreentext
        text={text}
        pcbX={pcbX}
        pcbY={pcbY + labelOffY}
        fontSize="0.7mm"
      />
    </>
  )

  // The R+C+trace subcircuit used by col A, C
  const RCTrace = () => (
    <>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={0}
        pcbY={3}
      />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    </>
  )

  circuit.add(
    <board width="90mm" height="80mm">
      {/* ============ Column A: R1(1k)+C1(100nF)+trace, cached ============ */}
      <silkscreentext
        text="A: R+C cached"
        pcbX={colX[0]}
        pcbY={rowY(0) + 9}
        fontSize="0.8mm"
      />

      <Label text="S1 MISS" pcbX={colX[0]} pcbY={rowY(0)} />
      <subcircuit
        name="S1"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(0)}
      >
        <RCTrace />
      </subcircuit>

      <Label text="S2 HIT" pcbX={colX[0]} pcbY={rowY(1)} />
      <subcircuit
        name="S2"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(1)}
      >
        <RCTrace />
      </subcircuit>

      <Label text="S6 HIT pos" pcbX={colX[0]} pcbY={rowY(2)} />
      <subcircuit
        name="S6"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(2)}
      >
        <RCTrace />
      </subcircuit>

      <Label text="S7 HIT sch" pcbX={colX[0]} pcbY={rowY(3)} />
      <subcircuit
        name="S7"
        _subcircuitCachingEnabled
        pcbX={colX[0]}
        pcbY={rowY(3)}
        schX={10}
        schY={10}
      >
        <RCTrace />
      </subcircuit>

      {/* ============ Column B: R1(2k), cached ============ */}
      <silkscreentext
        text="B: R(2k) cached"
        pcbX={colX[1]}
        pcbY={rowY(0) + 9}
        fontSize="0.8mm"
      />

      <Label text="S3 MISS" pcbX={colX[1]} pcbY={rowY(0)} />
      <subcircuit
        name="S3"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(0)}
      >
        <resistor name="R1" resistance="2k" footprint="0402" />
      </subcircuit>

      <Label text="S5 HIT" pcbX={colX[1]} pcbY={rowY(1)} />
      <subcircuit
        name="S5"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(1)}
      >
        <resistor name="R1" resistance="2k" footprint="0402" />
      </subcircuit>

      <Label text="S11 HIT" pcbX={colX[1]} pcbY={rowY(2)} />
      <subcircuit
        name="S11"
        _subcircuitCachingEnabled
        pcbX={colX[1]}
        pcbY={rowY(2)}
      >
        <resistor name="R1" resistance="2k" footprint="0402" />
      </subcircuit>

      {/* ============ Column C: R+C same structure, NO caching ============ */}
      <silkscreentext
        text="C: R+C no cache"
        pcbX={colX[2]}
        pcbY={rowY(0) + 9}
        fontSize="0.8mm"
      />

      <Label text="S4 normal" pcbX={colX[2]} pcbY={rowY(0)} />
      <subcircuit name="S4" pcbX={colX[2]} pcbY={rowY(0)}>
        <RCTrace />
      </subcircuit>

      <Label text="S9 normal" pcbX={colX[2]} pcbY={rowY(1)} />
      <subcircuit name="S9" pcbX={colX[2]} pcbY={rowY(1)}>
        <RCTrace />
      </subcircuit>

      {/* ============ Column D: R+C(220nF), cached unique ============ */}
      <silkscreentext
        text="D: C=220nF"
        pcbX={colX[3]}
        pcbY={rowY(0) + 9}
        fontSize="0.8mm"
      />

      <Label text="S8 MISS" pcbX={colX[3]} pcbY={rowY(0)} />
      <subcircuit
        name="S8"
        _subcircuitCachingEnabled
        pcbX={colX[3]}
        pcbY={rowY(0)}
      >
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor
          name="C1"
          capacitance="220nF"
          footprint="0402"
          pcbX={0}
          pcbY={3}
        />
        <trace from=".R1 > .pin2" to=".C1 > .pin1" />
      </subcircuit>

      {/* ============ Column E: R(0805)+C, cached unique ============ */}
      <silkscreentext
        text="E: R=0805"
        pcbX={colX[4]}
        pcbY={rowY(0) + 9}
        fontSize="0.8mm"
      />

      <Label text="S10 MISS" pcbX={colX[4]} pcbY={rowY(0)} />
      <subcircuit
        name="S10"
        _subcircuitCachingEnabled
        pcbX={colX[4]}
        pcbY={rowY(0)}
      >
        <resistor name="R1" resistance="1k" footprint="0805" />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={0}
          pcbY={3}
        />
        <trace from=".R1 > .pin2" to=".C1 > .pin1" />
      </subcircuit>

      {/* ============ Column F: chip+R, cached ============ */}
      <silkscreentext
        text="F: chip+R cached"
        pcbX={colX[5]}
        pcbY={rowY(0) + 9}
        fontSize="0.8mm"
      />

      <Label text="S12 MISS" pcbX={colX[5]} pcbY={rowY(0)} />
      <subcircuit
        name="S12"
        _subcircuitCachingEnabled
        pcbX={colX[5]}
        pcbY={rowY(0)}
      >
        <chip name="LED1" footprint="0402" />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={3}
        />
        <trace from=".LED1 > .pin1" to=".R1 > .pin1" />
      </subcircuit>

      <Label text="S13 HIT" pcbX={colX[5]} pcbY={rowY(1)} />
      <subcircuit
        name="S13"
        _subcircuitCachingEnabled
        pcbX={colX[5]}
        pcbY={rowY(1)}
      >
        <chip name="LED1" footprint="0402" />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={3}
        />
        <trace from=".LED1 > .pin1" to=".R1 > .pin1" />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // ---------------------------------------------------------------
  // 1. Verify cache size — 5 unique cached structures
  //    a) R1(1k)+C1(100nF)+trace   (S1 miss, S2/S6/S7 hit)
  //    b) R1(2k)                   (S3 miss, S5/S11 hit)
  //    c) R1(1k)+C1(220nF)+trace   (S8 miss)
  //    d) R1(1k,0805)+C1(100nF)+t  (S10 miss)
  //    e) LED1+R1(1k)+trace        (S12 miss, S13 hit)
  // ---------------------------------------------------------------
  expect(circuit._cachedSubcircuitCircuitJson.size).toBe(5)

  // ---------------------------------------------------------------
  // 2. Verify source component count
  //    S1:2 S2:2 S3:1 S4:2 S5:1 S6:2 S7:2 S8:2 S9:2 S10:2 S11:1 S12:2 S13:2
  //    Total = 26 (includes all cache hits that now inflate correctly)
  // ---------------------------------------------------------------
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  expect(sourceComponents.length).toBe(23)

  // ---------------------------------------------------------------
  // 3. All source_component_ids unique (no ID collisions from cache)
  // ---------------------------------------------------------------
  const scIds = sourceComponents.map((e: any) => e.source_component_id)
  expect(new Set(scIds).size).toBe(scIds.length)

  // ---------------------------------------------------------------
  // 4. Every subcircuit group name present
  // ---------------------------------------------------------------
  const sourceGroups = circuitJson.filter((e: any) => e.type === "source_group")
  const groupNames = sourceGroups.map((e: any) => e.name)
  for (const name of [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
    "S11",
    "S12",
    "S13",
  ]) {
    expect(groupNames).toContain(name)
  }

  // ---------------------------------------------------------------
  // 5. pcb_component count matches source_component count
  // ---------------------------------------------------------------
  const pcbComponents = circuitJson.filter(
    (e: any) => e.type === "pcb_component",
  )
  expect(pcbComponents.length).toBe(23)

  // ---------------------------------------------------------------
  // 6. All pcb_component_ids unique
  // ---------------------------------------------------------------
  const pcbIds = pcbComponents.map((e: any) => e.pcb_component_id)
  expect(new Set(pcbIds).size).toBe(pcbIds.length)

  // ---------------------------------------------------------------
  // 7. source_port count
  //    13 resistors * 2 + 8 capacitors * 2 + 2 chips * 2 = 46
  // ---------------------------------------------------------------
  const sourcePorts = circuitJson.filter((e: any) => e.type === "source_port")
  expect(sourcePorts.length).toBe(46)

  // ---------------------------------------------------------------
  // 8. All source_port_ids unique
  // ---------------------------------------------------------------
  const portIds = sourcePorts.map((e: any) => e.source_port_id)
  expect(new Set(portIds).size).toBe(portIds.length)

  // ---------------------------------------------------------------
  // 9. Non-cached subcircuits (S4, S9) rendered correctly
  // ---------------------------------------------------------------
  expect(sourceGroups.find((g: any) => g.name === "S4")).toBeDefined()
  expect(sourceGroups.find((g: any) => g.name === "S9")).toBeDefined()

  // ---------------------------------------------------------------
  // 10. PCB snapshot for visual regression
  // ---------------------------------------------------------------
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbGroups: true })
})
