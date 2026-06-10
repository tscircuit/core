import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

/**
 * A subcircuit with KiCad footprint and traces that takes time to render.
 * Used to benchmark caching performance.
 */
export function KicadSubcircuit({
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

export function getSubcircuitCachingPlatformConfig() {
  const { url: footprintServerUrl } = getTestFootprintServer(
    external0402Footprint,
  )

  return {
    footprintLibraryMap: {
      kicad: async (footprintName: string) => {
        const url = `${footprintServerUrl}/${footprintName}.circuit.json`
        const res = await fetch(url)
        return { footprintCircuitJson: await res.json() }
      },
    },
  }
}

export function addSingleCachedSubcircuitBoard(circuit: any) {
  circuit.add(
    <board width="20mm" height="10mm">
      <KicadSubcircuit name="S1" _subcircuitCachingEnabled pcbX={0} pcbY={0} />
    </board>,
  )
}

export function addCachedSubcircuitPanel(circuit: any) {
  const boardWidth = 15
  const boardHeight = 8
  const numBoards = 20

  circuit.add(
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
}

export function addNestedCachedSubcircuitBoard(circuit: any) {
  circuit.add(
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
}
