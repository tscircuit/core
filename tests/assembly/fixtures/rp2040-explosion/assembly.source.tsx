import { assembly } from "lib"
import type { ReactElement } from "react"
import { Cuboid, Cylinder, Subtract, Union } from "jscad-fiber"
import { createHexSocketBoltMesh } from "jscad-electronics/vanilla"

export const mountingCenters = [
  [-15.5, -15.5],
  [15.5, -15.5],
  [15.5, 15.5],
  [-15.5, 15.5],
] as const

// Actual socket-head mesh, in mm: head underside z=0, shaft points down.
const boltMesh = createHexSocketBoltMesh({
  metricSize: "M3",
  length: 35,
  showThreads: false,
})
const boltObj = [
  ...Array.from(
    { length: boltMesh.positions.length / 3 },
    (_, i) =>
      `v ${boltMesh.positions[i * 3]} ${boltMesh.positions[i * 3 + 1]} ${boltMesh.positions[i * 3 + 2]}`,
  ),
  ...Array.from(
    { length: boltMesh.indices.length / 3 },
    (_, i) =>
      `f ${boltMesh.indices[i * 3]! + 1} ${boltMesh.indices[i * 3 + 1]! + 1} ${boltMesh.indices[i * 3 + 2]! + 1}`,
  ),
].join("\n")
const boltUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(boltObj)}`

/** A nominal rear-mounted NEMA17 stack around the original routed controller.
 * PCB midplane z=0; motor rear face -10; spacer -10..-0.8;
 * cover supports 0.8..19, lid 19..21; M3x35 head underside 21.
 * Rear threads, encoder clearance and thermal behavior need hardware validation.
 */
export function Rp2040MotorAssembly({ board }: { board: ReactElement }) {
  return (
    <assembly.device name="RP2040_NEMA17">
      <assembly.part name="frame">
        <assembly.referencesurface
          name="motorRear"
          centerZOffset={-10}
          normalDirection="z-"
        />
      </assembly.part>
      <assembly.motor
        name="motor"
        standard="nema17"
        wireConnection="none"
        mountedTo="frame.motorRear"
        mountFace="backface"
      />
      <assembly.subassembly name="electronics">{board}</assembly.subassembly>
      {mountingCenters.map(([x, y], i) => (
        <assembly.printedpart
          key={`spacer${i}`}
          name={`spacer${i + 1}`}
          material="nylon"
          color="#e5e7eb"
          jscad={
            <Subtract>
              <Cylinder radius={3.2} height={9.2} center={[x, y, -5.4]} />
              <Cylinder radius={1.65} height={10} center={[x, y, -5.4]} />
            </Subtract>
          }
        />
      ))}
      <assembly.printedpart
        name="cover"
        material="petg"
        color="#3283b5"
        jscad={
          <Subtract>
            <Union>
              <Cuboid size={[44, 44, 2]} center={[0, 0, 20]} />
              {mountingCenters.map(([x, y], i) => (
                <Cylinder
                  key={i}
                  radius={3.2}
                  height={18.2}
                  center={[x, y, 9.9]}
                />
              ))}
            </Union>
            {mountingCenters.map(([x, y], i) => (
              <Cylinder key={i} radius={1.65} height={24} center={[x, y, 10]} />
            ))}
            {[-12, -8, -4, 0, 4, 8, 12].map((x) => (
              <Cuboid key={x} size={[2, 24, 4]} center={[x, 0, 20]} />
            ))}
          </Subtract>
        }
      />
      {mountingCenters.map(([x, y], i) => (
        <assembly.part
          key={`bolt${i}`}
          name={`bolt${i + 1}`}
          cadModel={{
            objUrl: boltUrl,
            modelBoardNormalDirection: "z+",
            positionOffset: { x, y, z: 21 },
          }}
        />
      ))}
      <assembly.explosion.stage name="lift-cover">
        <assembly.explosion.move
          targetRefs={["cover", "remove-bolts"]}
          offZ={24}
        />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="remove-bolts" prevStageRef="lift-cover">
        <assembly.explosion.move
          targetRefs="bolt1,bolt2,bolt3,bolt4"
          offZ={41}
        />
      </assembly.explosion.stage>
      <assembly.explosion.stage
        name="separate-motor"
        prevStageRef="remove-bolts"
      >
        <assembly.explosion.move targetRef="motor" offZ={-24} />
      </assembly.explosion.stage>
      <assembly.explosion.stage
        name="separate-spacers"
        prevStageRef="separate-motor"
      >
        <assembly.explosion.move
          targetRefs={["spacer1", "spacer2", "spacer3", "spacer4"]}
          offZ={-12}
        />
      </assembly.explosion.stage>
    </assembly.device>
  )
}
