import { basename, dirname, join, resolve } from "node:path"

const odbRootFlagIndex = Bun.argv.indexOf("--odb-root")
const outputFlagIndex = Bun.argv.indexOf("--output")

if (odbRootFlagIndex < 0 || outputFlagIndex < 0) {
  throw new Error(
    "Usage: bun scripts/generate-am62l-altium-reference.ts --odb-root <odb/steps/pcb> --output <fixture.json>",
  )
}

const odbRoot = resolve(Bun.argv[odbRootFlagIndex + 1]!)
const outputPath = resolve(Bun.argv[outputFlagIndex + 1]!)

interface Point {
  x: number
  y: number
}

interface OdbLine {
  id: number
  a: Point
  b: Point
  widthMm: number
}

interface OdbVia extends Point {
  id: number
  holeDiameterMm: number
  outerDiameterMm: number
}

interface OdbSurface {
  id: number
  contours: Array<{ type: "H" | "I"; points: Point[] }>
}

const mmPerInch = 25.4
const mmPerMil = 0.0254
const round = (value: number) => Number(value.toFixed(9))
const toMm = (value: number) => round(value * mmPerInch)
const pointKey = ({ x, y }: Point) => `${x.toFixed(6)},${y.toFixed(6)}`

const parsePrimaryFeatures = (text: string) =>
  text.split(/\r?\n/).filter((line) => /^[PLATBS] /.test(line))

const parseFeatureBlocks = (text: string) => {
  const lines = text.split(/\r?\n/)
  const blocks: string[][] = []
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    if (!/^[PLATBS] /.test(lines[lineIndex]!)) continue
    const block = [lines[lineIndex]!]
    if (lines[lineIndex]!.startsWith("S ")) {
      while (++lineIndex < lines.length) {
        block.push(lines[lineIndex]!)
        if (lines[lineIndex]!.startsWith("SE")) break
      }
    }
    blocks.push(block)
  }
  return blocks
}

const parseSymbols = (text: string) =>
  new Map(
    [...text.matchAll(/^\$(\d+)\s+(\S+)/gm)].map((match) => [
      Number(match[1]),
      match[2]!,
    ]),
  )

const parseSurface = (id: number, block: string[]): OdbSurface => {
  const contours: OdbSurface["contours"] = []
  let activeContour: OdbSurface["contours"][number] | undefined
  for (const line of block) {
    const start = line.match(/^OB ([\d.-]+) ([\d.-]+) ([IH])$/)
    if (start) {
      activeContour = {
        type: start[3] as "H" | "I",
        points: [{ x: Number(start[1]), y: Number(start[2]) }],
      }
      contours.push(activeContour)
      continue
    }
    const segment = line.match(/^OS ([\d.-]+) ([\d.-]+)$/)
    if (segment && activeContour) {
      activeContour.points.push({
        x: Number(segment[1]),
        y: Number(segment[2]),
      })
    }
  }
  return { id, contours }
}

const isPointInPolygon = (point: Point, polygon: Point[]) => {
  let inside = false
  for (
    let pointIndex = 0, previousIndex = polygon.length - 1;
    pointIndex < polygon.length;
    previousIndex = pointIndex++
  ) {
    const current = polygon[pointIndex]!
    const previous = polygon[previousIndex]!
    if (
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x
    ) {
      inside = !inside
    }
  }
  return inside
}

const isPointInSurface = (point: Point, surface: OdbSurface) =>
  surface.contours.some(
    (contour) =>
      contour.type === "I" && isPointInPolygon(point, contour.points),
  ) &&
  !surface.contours.some(
    (contour) =>
      contour.type === "H" && isPointInPolygon(point, contour.points),
  )

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const clipPolygonToBounds = (polygon: Point[], bounds: Bounds) => {
  const boundaries = [
    {
      inside: (point: Point) => point.x >= bounds.minX,
      intersect: (a: Point, b: Point) => ({
        x: bounds.minX,
        y: a.y + ((b.y - a.y) * (bounds.minX - a.x)) / (b.x - a.x),
      }),
    },
    {
      inside: (point: Point) => point.x <= bounds.maxX,
      intersect: (a: Point, b: Point) => ({
        x: bounds.maxX,
        y: a.y + ((b.y - a.y) * (bounds.maxX - a.x)) / (b.x - a.x),
      }),
    },
    {
      inside: (point: Point) => point.y >= bounds.minY,
      intersect: (a: Point, b: Point) => ({
        x: a.x + ((b.x - a.x) * (bounds.minY - a.y)) / (b.y - a.y),
        y: bounds.minY,
      }),
    },
    {
      inside: (point: Point) => point.y <= bounds.maxY,
      intersect: (a: Point, b: Point) => ({
        x: a.x + ((b.x - a.x) * (bounds.maxY - a.y)) / (b.y - a.y),
        y: bounds.maxY,
      }),
    },
  ]

  let output = polygon
  for (const boundary of boundaries) {
    const input = output
    output = []
    for (let pointIndex = 0; pointIndex < input.length; pointIndex++) {
      const current = input[pointIndex]!
      const previous = input[(pointIndex + input.length - 1) % input.length]!
      const currentInside = boundary.inside(current)
      const previousInside = boundary.inside(previous)
      if (currentInside) {
        if (!previousInside) output.push(boundary.intersect(previous, current))
        output.push(current)
      } else if (previousInside) {
        output.push(boundary.intersect(previous, current))
      }
    }
  }
  return output.filter(
    (point, pointIndex) =>
      pointIndex === 0 ||
      point.x !== output[pointIndex - 1]!.x ||
      point.y !== output[pointIndex - 1]!.y,
  )
}

const parseComponentPads = (componentText: string, reference: string) => {
  const referencePosition = componentText.indexOf(` N ${reference} `)
  if (referencePosition < 0) throw new Error(`Missing ${reference}`)
  const componentStart = componentText.lastIndexOf("CMP ", referencePosition)
  const nextComponent = componentText.indexOf("\n# CMP", referencePosition)
  const block = componentText.slice(
    componentStart,
    nextComponent < 0 ? undefined : nextComponent,
  )
  return block.split(/\r?\n/).flatMap((line) => {
    if (!line.startsWith("TOP ")) return []
    const fields = line.split(/\s+/)
    return [
      {
        x: Number(fields[2]),
        y: Number(fields[3]),
        netId: Number(fields[6]),
        name: fields[8]!,
      },
    ]
  })
}

const [edaText, componentText, topText, l3Text, bottomText, drillText] =
  await Promise.all(
    [
      "eda/data",
      "layers/comp_+_top/components",
      "layers/top/features",
      "layers/l3-signal-1/features",
      "layers/bottom/features",
      "layers/drill_plated_bottom-top/features",
    ].map((relativePath) => Bun.file(join(odbRoot, relativePath)).text()),
  )

const layerNames = edaText
  .match(/^LYR (.+)$/m)![1]!
  .trim()
  .split(/\s+/)
const featureTexts = new Map([
  ["top", topText],
  ["l3-signal-1", l3Text],
  ["bottom", bottomText],
  ["drill_plated_bottom-top", drillText],
])
const primaryFeatures = new Map(
  [...featureTexts].map(([layerName, text]) => [
    layerName,
    parsePrimaryFeatures(text),
  ]),
)
const featureSymbols = new Map(
  [...featureTexts].map(([layerName, text]) => [layerName, parseSymbols(text)]),
)
const topFeatureBlocks = parseFeatureBlocks(topText)

const targetDdrNetNames = new Set([
  "LPDDR4_RESET_N",
  "LPDDR4_DQS1_P",
  "LPDDR4_DQS1_N",
  "LPDDR4_DQS0_P",
  "LPDDR4_DQS0_N",
  ...Array.from({ length: 16 }, (_, bit) => `LPDDR4_DQ${bit}`),
  "LPDDR4_DMI1",
  "LPDDR4_DMI0",
  "LPDDR4_CS0",
  "LPDDR4_CKE0",
  "LPDDR4_CK_P",
  "LPDDR4_CK_N",
  ...Array.from({ length: 6 }, (_, bit) => `LPDDR4_CA${bit}`),
])

const netSections = edaText.split(/^#NET /m).slice(1)
const selectedDdrNets = netSections.flatMap((section) => {
  const netId = Number(section.match(/^(\d+)/)![1])
  const name = section.match(/^NET (.+)$/m)?.[1]?.trim() ?? ""
  if (!targetDdrNetNames.has(name)) return []
  const featureIds = [...section.matchAll(/^FID\s+\S+\s+(\d+)\s+(\d+)/gm)].map(
    (match) => ({
      layerName: layerNames[Number(match[1])]!,
      featureId: Number(match[2]),
    }),
  )
  return [{ netId, name, featureIds }]
})

const signalSegments = selectedDdrNets.flatMap(({ netId, featureIds }) =>
  featureIds.flatMap(({ layerName, featureId }) => {
    if (!["top", "l3-signal-1", "bottom"].includes(layerName)) return []
    const feature = primaryFeatures.get(layerName)![featureId]
    if (!feature?.startsWith("L ")) return []
    const fields = feature.split(/\s+/)
    const symbol = featureSymbols.get(layerName)!.get(Number(fields[5])) ?? ""
    const widthMil = Number(symbol.match(/^r([\d.]+)$/)?.[1])
    return [
      {
        netId,
        layerName,
        a: { x: Number(fields[1]), y: Number(fields[2]) },
        b: { x: Number(fields[3]), y: Number(fields[4]) },
        widthMm: widthMil * mmPerMil,
      },
    ]
  }),
)

const signalVias = selectedDdrNets.flatMap(({ netId, featureIds }) =>
  featureIds.flatMap(({ layerName, featureId }) => {
    if (layerName !== "drill_plated_bottom-top") return []
    const feature = primaryFeatures.get(layerName)![featureId]
    if (!feature?.startsWith("P ") || !/[,;]1=2(?:,|$)/.test(feature)) return []
    const fields = feature.split(/\s+/)
    const drillSymbol =
      featureSymbols.get(layerName)!.get(Number(fields[3])) ?? ""
    const drillMil = Number(drillSymbol.match(/^r([\d.]+)$/)?.[1])
    const geometryId = Number(feature.match(/;0=(\d+)/)?.[1])
    if (geometryId !== 16) {
      throw new Error(`Unexpected signal-via geometry ${geometryId}`)
    }
    return [
      {
        netId,
        id: featureId,
        x: Number(fields[1]),
        y: Number(fields[2]),
        holeDiameterMm: drillMil * mmPerMil,
        outerDiameterMm: 18 * mmPerMil,
      },
    ]
  }),
)

const dgndSectionStart = edaText.indexOf("#NET 912")
const dgndSectionEnd = edaText.indexOf("#NET 913", dgndSectionStart)
const dgndSection = edaText.slice(dgndSectionStart, dgndSectionEnd)
if (!/^NET DGND$/m.test(dgndSection)) throw new Error("ODB net 912 is not DGND")

const dgndTopFeatureIds = [...dgndSection.matchAll(/^FID C 23 (\d+)/gm)].map(
  (match) => Number(match[1]),
)
const dgndDrillFeatureIds = [...dgndSection.matchAll(/^FID H 4 (\d+)/gm)].map(
  (match) => Number(match[1]),
)

const dgndLines: OdbLine[] = dgndTopFeatureIds.flatMap((featureId) => {
  const feature = primaryFeatures.get("top")![featureId]
  if (!feature?.startsWith("L ")) return []
  const fields = feature.split(/\s+/)
  const symbol = featureSymbols.get("top")!.get(Number(fields[5])) ?? ""
  const widthMil = Number(symbol.match(/^r([\d.]+)$/)?.[1])
  return [
    {
      id: featureId,
      a: { x: Number(fields[1]), y: Number(fields[2]) },
      b: { x: Number(fields[3]), y: Number(fields[4]) },
      widthMm: widthMil * mmPerMil,
    },
  ]
})

const dgndVias: OdbVia[] = dgndDrillFeatureIds.flatMap((featureId) => {
  const feature = primaryFeatures.get("drill_plated_bottom-top")![featureId]
  if (!feature?.startsWith("P ") || !/[,;]1=2(?:,|$)/.test(feature)) return []
  const fields = feature.split(/\s+/)
  const drillSymbol =
    featureSymbols.get("drill_plated_bottom-top")!.get(Number(fields[3])) ?? ""
  const drillMil = Number(drillSymbol.match(/^r([\d.]+)$/)?.[1])
  const geometryId = Number(feature.match(/;0=(\d+)/)?.[1])
  return [
    {
      id: featureId,
      x: Number(fields[1]),
      y: Number(fields[2]),
      holeDiameterMm: drillMil * mmPerMil,
      outerDiameterMm: (geometryId === 16 ? 18 : 20) * mmPerMil,
    },
  ]
})

const dgndSurfaces = dgndTopFeatureIds.flatMap((featureId) => {
  const block = topFeatureBlocks[featureId]
  return block?.[0]?.startsWith("S ") ? [parseSurface(featureId, block)] : []
})

const linesByNode = new Map<string, OdbLine[]>()
for (const line of dgndLines) {
  for (const endpoint of [line.a, line.b]) {
    const key = pointKey(endpoint)
    linesByNode.set(key, [...(linesByNode.get(key) ?? []), line])
  }
}
const viasByNode = new Map(dgndVias.map((via) => [pointKey(via), via]))
const selectedGroundLineIds = new Set<number>()
const selectedGroundViaIds = new Set<number>()
const selectedGroundSurfaceIds = new Set<number>()
const componentPads = ["U28", "U29"].flatMap((reference) =>
  parseComponentPads(componentText, reference).map((pad) => ({
    ...pad,
    reference,
  })),
)

for (const reference of ["U28", "U29"]) {
  const visitedNodes = new Set<string>()
  for (const pad of componentPads.filter(
    (candidate) => candidate.reference === reference && candidate.netId === 912,
  )) {
    const start = pointKey(pad)
    if (linesByNode.has(start) && !visitedNodes.has(start)) {
      const pending = [start]
      visitedNodes.add(start)
      while (pending.length > 0) {
        const node = pending.pop()!
        const [x, y] = node.split(",").map(Number)
        const via = viasByNode.get(node)
        if (via) selectedGroundViaIds.add(via.id)
        for (const surface of dgndSurfaces) {
          if (isPointInSurface({ x: x!, y: y! }, surface)) {
            selectedGroundSurfaceIds.add(surface.id)
          }
        }
        for (const line of linesByNode.get(node) ?? []) {
          selectedGroundLineIds.add(line.id)
          const next = pointKey(pointKey(line.a) === node ? line.b : line.a)
          if (!visitedNodes.has(next)) {
            visitedNodes.add(next)
            pending.push(next)
          }
        }
      }
    }
    for (const surface of dgndSurfaces) {
      if (isPointInSurface(pad, surface)) {
        selectedGroundSurfaceIds.add(surface.id)
      }
    }
  }
}

const selectedGroundLines = dgndLines.filter((line) =>
  selectedGroundLineIds.has(line.id),
)
const selectedGroundVias = dgndVias.filter((via) =>
  selectedGroundViaIds.has(via.id),
)
const selectedGroundSurfaces = dgndSurfaces.filter((surface) =>
  selectedGroundSurfaceIds.has(surface.id),
)

const geometryPoints = [
  ...componentPads,
  ...signalSegments.flatMap((segment) => [segment.a, segment.b]),
  ...signalVias,
  ...selectedGroundLines.flatMap((line) => [line.a, line.b]),
  ...selectedGroundVias,
]
const geometryBounds = {
  minX: Math.min(...geometryPoints.map((point) => toMm(point.x))),
  maxX: Math.max(...geometryPoints.map((point) => toMm(point.x))),
  minY: Math.min(...geometryPoints.map((point) => toMm(point.y))),
  maxY: Math.max(...geometryPoints.map((point) => toMm(point.y))),
}
const cropPaddingMm = 1.5
const cropBoundsMm = {
  minX: round(geometryBounds.minX - cropPaddingMm),
  maxX: round(geometryBounds.maxX + cropPaddingMm),
  minY: round(geometryBounds.minY - cropPaddingMm),
  maxY: round(geometryBounds.maxY + cropPaddingMm),
}
const cropBoundsInches = {
  minX: cropBoundsMm.minX / mmPerInch,
  maxX: cropBoundsMm.maxX / mmPerInch,
  minY: cropBoundsMm.minY / mmPerInch,
  maxY: cropBoundsMm.maxY / mmPerInch,
}
const translationMm = {
  x: round(-(cropBoundsMm.minX + cropBoundsMm.maxX) / 2),
  y: round(-(cropBoundsMm.minY + cropBoundsMm.maxY) / 2),
}
const translatedPoint = (point: Point) => [
  round(toMm(point.x) + translationMm.x),
  round(toMm(point.y) + translationMm.y),
]

const clippedGroundSurfacePolygons = selectedGroundSurfaces.flatMap(
  (surface) => {
    const outerRings = surface.contours
      .filter((contour) => contour.type === "I")
      .map((contour) => clipPolygonToBounds(contour.points, cropBoundsInches))
      .filter((points) => points.length >= 3)
    const holeRings = surface.contours
      .filter((contour) => contour.type === "H")
      .map((contour) => clipPolygonToBounds(contour.points, cropBoundsInches))
      .filter((points) => points.length >= 3)
    return outerRings.map((outerRing, polygonIndex) => ({
      sourceFeatureId: surface.id,
      polygonIndex,
      outerRing: outerRing.map(translatedPoint),
      innerRings: holeRings
        .filter((holeRing) => isPointInPolygon(holeRing[0]!, outerRing))
        .map((holeRing) => holeRing.map(translatedPoint)),
    }))
  },
)

const layerCode = (layerName: string) =>
  ({ top: 0, "l3-signal-1": 2, bottom: 5 })[layerName]!

const fixture = {
  provenance: {
    source: "Texas Instruments TMDS62LEVM design files SPRCAL9 Rev. B",
    publicSourceUrl: "https://www.ti.com/lit/zip/sprcal9",
    nativePcbDoc: "PROC181E1-1_PRJPCB.zip::PROC181E1-1_BRD_11_3.pcbdoc",
    nativePcbDocSha256:
      "8444ad8456ff028b7aa11389362ba2fbc01291e87ff46e394576cb044c3612fc",
    containingZipSha256:
      "636a654aa21de431d5c80519c5b8910a9e0e629cba5216dc3b1cbb4b0e598532",
    extractionSource: "PROC181E1-1_ODBGBR.tgz",
    coordinateFrame:
      "+X right, +Y up, millimeters; source geometry receives translation only",
    translationMm,
    cropBoundsBeforeTranslationMm: cropBoundsMm,
    sourceLayerStack: [
      "TOP",
      "L2-GROUND-1",
      "L3-SIGNAL-1",
      "L4-POWER",
      "L5-GROUND-2",
      "BOTTOM",
    ],
  },
  counts: {
    ddrNets: selectedDdrNets.length,
    signalSegments: signalSegments.length,
    signalVias: signalVias.length,
    componentPads: componentPads.length,
    groundPads: componentPads.filter((pad) => pad.netId === 912).length,
    groundSegments: selectedGroundLines.length,
    groundSourceSurfaces: selectedGroundSurfaces.length,
    groundSurfacePolygonsAfterCrop: clippedGroundSurfacePolygons.length,
    groundVias: selectedGroundVias.length,
  },
  viewport: {
    minX: round(cropBoundsMm.minX + translationMm.x),
    maxX: round(cropBoundsMm.maxX + translationMm.x),
    minY: round(cropBoundsMm.minY + translationMm.y),
    maxY: round(cropBoundsMm.maxY + translationMm.y),
  },
  pads: componentPads.map((pad) => [
    pad.reference === "U28" ? 28 : 29,
    pad.name.replace(`${pad.reference}-`, ""),
    pad.netId,
    ...translatedPoint(pad),
    pad.reference === "U28" ? 0.127 : 0.1651,
  ]),
  signalSegments: signalSegments.map((segment) => [
    segment.netId,
    layerCode(segment.layerName),
    ...translatedPoint(segment.a),
    ...translatedPoint(segment.b),
    round(segment.widthMm),
  ]),
  signalVias: signalVias.map((via) => [
    via.netId,
    ...translatedPoint(via),
    round(via.outerDiameterMm),
    round(via.holeDiameterMm),
  ]),
  groundSegments: selectedGroundLines.map((line) => [
    ...translatedPoint(line.a),
    ...translatedPoint(line.b),
    round(line.widthMm),
  ]),
  groundVias: selectedGroundVias.map((via) => [
    ...translatedPoint(via),
    round(via.outerDiameterMm),
    round(via.holeDiameterMm),
  ]),
  groundSurfaces: clippedGroundSurfacePolygons,
}

const expectedCounts = {
  ddrNets: 33,
  signalSegments: 732,
  signalVias: 66,
  componentPads: 573,
  groundPads: 155,
  groundSegments: 302,
  groundSourceSurfaces: 19,
  groundVias: 85,
}
for (const [countName, expectedCount] of Object.entries(expectedCounts)) {
  const actualCount = fixture.counts[countName as keyof typeof fixture.counts]
  if (actualCount !== expectedCount) {
    throw new Error(
      `${countName}: expected ${expectedCount}, received ${actualCount}`,
    )
  }
}

await Bun.write(outputPath, `${JSON.stringify(fixture, null, 2)}\n`)
console.log(
  JSON.stringify(
    {
      output: join(basename(dirname(outputPath)), basename(outputPath)),
      bytes: Bun.file(outputPath).size,
      counts: fixture.counts,
      viewport: fixture.viewport,
    },
    null,
    2,
  ),
)
