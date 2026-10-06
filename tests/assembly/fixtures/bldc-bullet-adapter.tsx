import { assembly } from "lib"
import { RootCircuit } from "lib/RootCircuit"

/** Representative imported BLDC geometry for the fixture, in physical mm.
 * Three male outputs have mating tips at z=32.25, centered at (3,4), pitch 6.
 * Substitute the user's CAD asset and measured connector point in real designs.
 */
export function createBldcBulletAdapterCircuit({
  boardGender = "male",
  rotation = 0,
  toPinCount = 3,
  from = "MOTOR.phases",
}: {
  boardGender?: "male" | "female"
  rotation?: number
  toPinCount?: number
  from?: string
} = {}) {
  const circuit = new RootCircuit()
  circuit.add(
    <assembly.device>
      <assembly.subassembly
        name="MOTOR"
        cadModel={{
          positionOffset: { x: -38, y: 0, z: 0 },
          rotationOffset: rotation,
          jscad: {
            type: "union",
            shapes: [
              {
                type: "colorize",
                color: [0.15, 0.2, 0.28, 1],
                shape: {
                  type: "cylinder",
                  radius: 12,
                  height: 20,
                  center: [0, 0, 10],
                },
              },
              {
                type: "colorize",
                color: [0.65, 0.68, 0.7, 1],
                shape: {
                  type: "cylinder",
                  radius: 2.5,
                  height: 10,
                  center: [0, 0, -5],
                },
              },
              ...[-6, 0, 6].map((x) => ({
                type: "colorize",
                color: [0.83, 0.64, 0.22, 1],
                shape: {
                  type: "cylinder",
                  radius: 2.05,
                  height: 12.25,
                  center: [3 + x, 4, 26.125],
                },
              })),
            ],
          },
        }}
        cableConnectors={{
          phases: {
            standard: "bullet",
            bulletDiameter: 3.5,
            bulletGender: "male",
            pinCount: 3,
            position: { x: 3, y: 4, z: 32.25 },
            facingDirection: "z+",
          },
        }}
      />
      <board width={55} height={35} routingDisabled>
        <connector
          name="J_PHASES"
          standard="bullet"
          bulletDiameter={4}
          bulletGender={boardGender}
          pinCount={toPinCount}
          pcbX={18}
          cadModel={{
            jscad: {
              type: "colorize",
              color: [0.83, 0.64, 0.22, 1],
              shape: {
                type: "union",
                shapes: Array.from({ length: toPinCount }, (_, pin) => ({
                  type: "cylinder",
                  radius: boardGender === "male" ? 2.3 : 2.5,
                  height: 14,
                  center: [(pin - (toPinCount - 1) / 2) * 6, 0, 7],
                })),
              },
            },
          }}
          footprint={
            <footprint>
              {Array.from({ length: toPinCount }, (_, pin) => (
                <platedhole
                  key={`pin${pin + 1}`}
                  pcbX={(pin - (toPinCount - 1) / 2) * 6}
                  portHints={[`pin${pin + 1}`]}
                  holeDiameter={1.5}
                  outerDiameter={3}
                  shape="circle"
                />
              ))}
            </footprint>
          }
        />
      </board>
      <assembly.cable name="PHASE_LEADS" from={from} to=".J_PHASES" />
    </assembly.device>,
  )
  return circuit
}
