import { assembly } from "lib"
import { RootCircuit } from "lib/RootCircuit"
import type { BulletDiameter, BulletGender } from "@tscircuit/cableprinter"

/** Representative PCB bodies for the fixture; custom footprints supply their own CAD. */
function bulletPcbBody(
  diameter: BulletDiameter,
  gender: BulletGender,
  pinCount = 1,
) {
  return {
    jscad: {
      type: "colorize",
      color: [0.83, 0.64, 0.22, 1],
      shape:
        pinCount === 1
          ? {
              type: "cylinder",
              radius: (diameter + (gender === "male" ? 0.6 : 1)) / 2,
              height: diameter * 3.5,
              center: [0, 0, diameter * 1.75],
            }
          : {
              type: "union",
              shapes: Array.from({ length: pinCount }, (_, index) => ({
                type: "cylinder",
                radius: (diameter + (gender === "male" ? 0.6 : 1)) / 2,
                height: diameter * 3.5,
                center: [
                  (index - (pinCount - 1) / 2) * (diameter + 2),
                  0,
                  diameter * 1.75,
                ],
              })),
            },
    },
  }
}

/** Single-pad PCB solder bullets; cable mating axes point above/below the PCB. */
export function createBulletCableCircuit({
  diameter,
  fromGender = "male",
  toGender = "female",
  toDiameter = diameter,
  layer = "top",
  pinCount = 1,
  toPinCount = pinCount,
}: {
  diameter: BulletDiameter
  pinCount?: number
  toPinCount?: number
  fromGender?: BulletGender
  toGender?: BulletGender
  toDiameter?: BulletDiameter
  layer?: "top" | "bottom"
}) {
  const circuit = new RootCircuit()
  circuit.add(
    <assembly.device>
      <board width={70} height={30} routingDisabled>
        <connector
          name="J1"
          standard="bullet"
          bulletDiameter={diameter}
          bulletGender={fromGender}
          pinCount={pinCount}
          cadModel={bulletPcbBody(diameter, fromGender, pinCount)}
          pcbX={-25}
          layer={layer}
          footprint={
            <footprint>
              {Array.from({ length: pinCount }, (_, index) => (
                <platedhole
                  pcbX={(index - (pinCount - 1) / 2) * (diameter + 2)}
                  portHints={[`pin${index + 1}`]}
                  holeDiameter={1.5}
                  outerDiameter={3}
                  shape="circle"
                />
              ))}
            </footprint>
          }
        />
        <connector
          name="J2"
          standard="bullet"
          bulletDiameter={toDiameter}
          bulletGender={toGender}
          pinCount={toPinCount}
          cadModel={bulletPcbBody(toDiameter, toGender, toPinCount)}
          pcbX={25}
          layer={layer}
          footprint={
            <footprint>
              {Array.from({ length: toPinCount }, (_, index) => (
                <platedhole
                  pcbX={(index - (toPinCount - 1) / 2) * (toDiameter + 2)}
                  portHints={[`pin${index + 1}`]}
                  holeDiameter={1.5}
                  outerDiameter={3}
                  shape="circle"
                />
              ))}
            </footprint>
          }
        />
      </board>
      <assembly.cable name="POWER" from=".J1" to=".J2" standard="bullet" />
    </assembly.device>,
  )
  return circuit
}
