import { assembly, enclosure } from "lib"
import type { JscadOperation } from "jscad-planner"

export type PortKind = "usb" | "dial" | "terminal" | "jst" | "display"
export interface PortConfig {
  kind: PortKind
  name: string
  rotation?: number
  layer?: "top" | "bottom"
  x?: number
  y?: number
  offset?: number
  widthOffset?: number
  undersized?: boolean
  recessed?: boolean
  objUrl?: string
}
const cuboid = (
  size: [number, number, number],
  center: [number, number, number],
): JscadOperation => ({
  type: "translate",
  vector: center,
  shape: { type: "cuboid", size },
})
const cylinder = (
  radius: number,
  height: number,
  center: [number, number, number],
): JscadOperation =>
  ({ type: "cylinder", radius, height, center, segments: 32 }) as JscadOperation
const union = (...shapes: JscadOperation[]): JscadOperation => ({
  type: "union",
  shapes,
})
const subtract = (...shapes: JscadOperation[]): JscadOperation => ({
  type: "subtract",
  shapes,
})
const rotateX = (angle: number, shape: JscadOperation): JscadOperation => ({
  type: "rotateX",
  angle,
  shape,
})

// Closed simplified mechanical models with sockets, bores, shafts and levers.
// They are explicit test models, not manufacturer CAD or cable-motion envelopes.
function model(kind: PortKind): {
  shape: JscadOperation
  width: number
  height: number
  depth: number
} {
  if (kind === "usb")
    return {
      width: 10,
      height: 4,
      depth: 12,
      shape: subtract(
        {
          type: "translate",
          vector: [0, 0, 2],
          shape: {
            type: "roundedCuboid",
            size: [9, 12, 4],
            roundRadius: 0.6,
            segments: 16,
          },
        },
        cuboid([7.4, 14, 2.5], [0, 0, 2]),
      ),
    }
  if (kind === "dial")
    return {
      width: 12,
      height: 12,
      depth: 24,
      shape: union(
        cuboid([10, 7, 6], [0, 0, 3]),
        {
          type: "translate",
          vector: [0, 7, 6],
          shape: rotateX(Math.PI / 2, cylinder(2.5, 12, [0, 0, 0])),
        },
        {
          type: "translate",
          vector: [0, 12, 6],
          shape: rotateX(Math.PI / 2, cylinder(5, 4, [0, 0, 0])),
        },
      ),
    }
  if (kind === "terminal")
    return {
      width: 13,
      height: 12,
      depth: 14,
      shape: subtract(
        union(
          cuboid([12, 14, 10], [0, 0, 5]),
          ...[-3.5, 0, 3.5].map((x) => cuboid([2.4, 7, 2], [x, 1, 10.5])),
        ),
        ...[-3.5, 0, 3.5].map(
          (x) =>
            ({
              type: "translate",
              vector: [x, 0, 4],
              shape: rotateX(Math.PI / 2, cylinder(1.2, 16, [0, 0, 0])),
            }) as JscadOperation,
        ),
      ),
    }
  if (kind === "jst")
    return {
      width: 12,
      height: 6,
      depth: 12,
      shape: union(
        subtract(
          cuboid([11, 12, 5], [0, 0, 2.5]),
          cuboid([8.8, 14, 3.4], [0, 0, 2.7]),
        ),
        ...[-3, -1, 1, 3].map((x) => cuboid([0.5, 10, 0.5], [x, 0, 1.2])),
      ),
    }
  return {
    width: 24,
    height: 18,
    depth: 16,
    shape: union(
      cuboid([22, 16, 2], [0, 0, 14]),
      subtract(
        cuboid([22, 16, 1], [0, 0, 15.2]),
        cuboid([18, 12, 2], [0, 0, 15.2]),
      ),
      ...[-9, 9].flatMap((x) => [-6, 6].map((y) => cylinder(1, 14, [x, y, 7]))),
    ),
  }
}
function MechanicalPort({
  kind,
  name,
  rotation = 0,
  layer = "top",
  x,
  y,
  offset = 0,
  widthOffset = 0,
  undersized = false,
  recessed = false,
  objUrl,
}: PortConfig) {
  const part = model(kind)
  const angle = ((rotation % 360) + 360) % 360
  // Footprint insertion direction rotates in board coordinates on both layers.
  const position =
    angle === 90
      ? [-29, 0]
      : angle === 180
        ? [0, -21]
        : angle === 270
          ? [29, 0]
          : [0, 21]
  const vertical = kind === "display"
  return (
    <connector
      name={name}
      pcbX={x ?? (vertical ? 0 : position[0])}
      pcbY={y ?? (vertical ? 0 : recessed ? 14 : position[1])}
      pcbRotation={rotation}
      layer={layer}
      allowOffBoard
      pinCount={4}
      pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "SDA", pin4: "SCL" }}
      footprint={
        <footprint insertionDirection={vertical ? "from_above" : "from_top"}>
          {[-3, -1, 1, 3].map((x, i) => (
            <smtpad
              shape="rect"
              pcbX={x}
              pcbY={-2}
              width={0.8}
              height={2}
              portHints={[`pin${i + 1}`]}
            />
          ))}
        </footprint>
      }
      cadModel={{
        ...(objUrl ? { objUrl } : { jscad: part.shape }),
        modelOriginPosition: { x: 0, y: 0, z: 0 },
        size: { x: part.width, y: vertical ? 18 : part.depth, z: part.height },
        modelBounds: {
          min: { x: -part.width / 2, y: -part.depth / 2, z: 0 },
          max: {
            x: part.width / 2,
            y: part.depth / 2,
            z: vertical ? 16 : part.height,
          },
        },
      }}
    >
      {kind === "dial" ? (
        <enclosure.cutoutaperture
          shape="circle"
          radius={undersized ? 2 : 6.5}
          margin={0.4}
          heightDimensionOffset={offset}
          widthDimensionOffset={widthOffset}
        />
      ) : (
        <enclosure.cutoutaperture
          shape={kind === "usb" ? "pill" : "rect"}
          width={undersized ? part.width / 2 : part.width}
          height={undersized ? part.height / 2 : part.height}
          margin={0.6}
          heightDimensionOffset={offset}
          widthDimensionOffset={widthOffset}
        />
      )}
    </connector>
  )
}
export function RealisticEnclosureDrc({
  ports,
  title = "USB-PD instrument",
  inAssembly = true,
}: { ports: PortConfig[]; title?: string; inAssembly?: boolean }) {
  const content = (
    <>
      <board name="B1" width={60} height={44} routingDisabled>
        <chip
          name="U_PD"
          footprint="soic8"
          pcbX={-8}
          cadModel={{
            jscad: cuboid([6, 5, 1.5], [0, 0, 0.75]),
            modelOriginPosition: { x: 0, y: 0, z: 0 },
          }}
        />
        <chip
          name="U_MCU"
          footprint="qfp32"
          pcbX={7}
          cadModel={{
            jscad: cuboid([7, 7, 1.5], [0, 0, 0.75]),
            modelOriginPosition: { x: 0, y: 0, z: 0 },
          }}
        />
        <resistor
          name="R1"
          resistance="5.1k"
          footprint="0402"
          pcbX={-10}
          pcbY={-7}
          cadModel={{
            jscad: cuboid([1, 0.5, 0.5], [0, 0, 0.25]),
            modelOriginPosition: { x: 0, y: 0, z: 0 },
          }}
        />
        <capacitor
          name="C1"
          capacitance="10uF"
          footprint="0805"
          pcbX={0}
          pcbY={-7}
          cadModel={{
            jscad: cuboid([2, 1.2, 1], [0, 0, 0.5]),
            modelOriginPosition: { x: 0, y: 0, z: 0 },
          }}
        />
        {ports.map((port) => (
          <MechanicalPort key={port.name} {...port} />
        ))}
        {[-24, 24].flatMap((x) =>
          [-16, 16].map((y) => (
            <hole name={`MH_${x}_${y}`} pcbX={x} pcbY={y} diameter={3.2} />
          )),
        )}
        <pcbnotetext text={title} pcbY={-11} fontSize={1.2} />
      </board>
      <enclosure.fdm.box
        name="CASE"
        boardRef=".B1"
        topHeadroom={12}
        standoffHeight={ports.some((p) => p.layer === "bottom") ? 15 : 3}
      />
    </>
  )
  return inAssembly ? (
    <assembly.device name="PD_INSTRUMENT">{content}</assembly.device>
  ) : (
    <group>{content}</group>
  )
}
