import type { Point3 } from "circuit-json"
import { assembly } from "lib"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { Fragment } from "react"

interface GimbalPart {
  name: string
  printable: boolean
  objUrl: string
}

// See gimbal-one-mechanical.md for the original assembly and asset provenance.
// Mesh vertices are circuit-world points, right-handed millimeters:
// +X right, +Y top, +Z above. Keep each imported part at the world origin.
const parts: GimbalPart[] = JSON.parse(
  gunzipSync(
    readFileSync(new URL("./gimbal-one-mechanical.json.gz", import.meta.url)),
  ).toString(),
)

/** Proposed detachable PH3 terminations on the motor pigtails. These are not
 * connectors supplied on the Robu motor. Centers are mating-plane points in
 * circuit-world mm; the cable's wire exit is 6.85 mm along the outward normal.
 */
export const gimbalMotorPigtails = [
  {
    axis: "PITCH",
    motor: "REF_Pitch_2805",
    connectorX: -26,
    center: { x: 107, y: 21.5, z: 24 },
    plane: "xz",
    normalDirection: "y+",
    wireExit: { x: 107, y: 28.35, z: 24 },
  },
  {
    axis: "ROLL",
    motor: "REF_Roll_2805",
    connectorX: 0,
    center: { x: -30, y: 0, z: -118.75 },
    plane: "yz",
    normalDirection: "x-",
    wireExit: { x: -36.85, y: 0, z: -118.75 },
  },
  {
    axis: "YAW",
    motor: "REF_Yaw_2805",
    connectorX: 26,
    center: { x: 30, y: -122.25, z: 0 },
    plane: "yz",
    normalDirection: "x+",
    wireExit: { x: 36.85, y: -122.25, z: 0 },
  },
] as const

/** The Gimbal One neutral harness routes, excluding the connector and motor
 * endpoints. Circuit-world points in mm (+X right, +Y top, +Z above). The first
 * and last connector exits remain owned by assembly.cable, not these points.
 */
export const gimbalCableWaypoints: Record<"PITCH" | "ROLL" | "YAW", Point3[]> =
  {
    PITCH: [
      { x: -26, y: 19, z: 13.2 },
      { x: -78, y: 19, z: 13.2 },
      { x: -78, y: 19, z: -45 },
      { x: -30, y: 25, z: -50 },
      { x: 65, y: 36, z: -50 },
      { x: 103, y: 38, z: -40 },
      { x: 111, y: 40, z: -10 },
      { x: 110, y: 34, z: 30 },
    ],
    ROLL: [
      { x: 0, y: 5, z: 13.2 },
      { x: -86, y: 5, z: 13.2 },
      { x: -86, y: 5, z: -55 },
      { x: -60, y: -38, z: -65 },
      { x: -40, y: -44, z: -105 },
      { x: -36, y: -40, z: -135 },
      { x: -36, y: -32, z: -155 },
      { x: -42, y: -8, z: -150 },
      { x: -36, y: 18, z: -135 },
    ],
    YAW: [
      { x: 26, y: -9, z: 13.2 },
      { x: -94, y: -9, z: 13.2 },
      { x: -94, y: -9, z: -55 },
      { x: -65, y: -45, z: -80 },
      { x: -48, y: -90, z: -90 },
      { x: -42, y: -145, z: -60 },
      { x: -42, y: -145, z: 25 },
      { x: -30, y: -115, z: 45 },
      { x: 20, y: -98, z: 45 },
      { x: 40, y: -126, z: 30 },
      { x: 40, y: -127, z: 10 },
    ],
  }

/** Actual Gimbal One mechanical assembly with its one controller board reduced
 * to the three real motor headers and mounting holes. All 221 original rigid
 * meshes, including screws and washers, remain dimensionally unchanged.
 */
export function GimbalOneWaypoints({
  routed = true,
}: { routed?: boolean } = {}) {
  return (
    <assembly.device name="GIMBAL_ONE">
      <board
        name="CONTROLLER"
        width={84}
        height={70}
        thickness={1.6}
        layers={4}
        solderMaskColor="black"
        routingDisabled
      >
        {gimbalMotorPigtails.map(({ axis, connectorX }) => (
          <connector
            key={axis}
            name={`J_${axis}`}
            standard="jst_ph"
            pinCount={3}
            footprint="jst3_ph"
            pcbX={connectorX}
            pcbY={29}
          />
        ))}
        {[-38, 38].flatMap((x) =>
          [-31, 31].map((y) => (
            <Fragment key={`${x},${y}`}>
              <hole pcbX={x} pcbY={y} diameter={2.7} />
            </Fragment>
          )),
        )}
      </board>
      {parts.map((part) => {
        const cadModel = {
          objUrl: part.objUrl,
          modelOriginPosition: { x: 0, y: 0, z: 0 },
        }
        const pigtail = gimbalMotorPigtails.find(
          ({ motor }) => motor === part.name,
        )
        if (pigtail)
          return (
            <assembly.part key={part.name} name={part.name} cadModel={cadModel}>
              <assembly.referencesurface
                name="pigtail"
                plane={pigtail.plane}
                normalDirection={pigtail.normalDirection}
                centerXOffset={pigtail.center.x}
                centerYOffset={pigtail.center.y}
                centerZOffset={pigtail.center.z}
              />
            </assembly.part>
          )
        return part.printable ? (
          <assembly.printedpart
            key={part.name}
            name={part.name}
            material="petg"
            color="#121314"
            cadModel={cadModel}
          />
        ) : (
          <assembly.part key={part.name} name={part.name} cadModel={cadModel} />
        )
      })}
      {gimbalMotorPigtails.map(({ axis, motor }) => (
        <assembly.cable
          key={axis}
          name={`HARNESS_${axis}`}
          from={`.CONTROLLER > .J_${axis}`}
          to={`${motor}.pigtail`}
          model="jst_ph_pins3"
          waypoints={routed ? gimbalCableWaypoints[axis] : undefined}
        />
      ))}
    </assembly.device>
  )
}
