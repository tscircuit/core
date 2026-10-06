import { assembly } from "lib"
import { RootCircuit } from "lib/RootCircuit"
import type { BulletDiameter, BulletGender } from "@tscircuit/cableprinter"

/** Representative PCB bodies for the fixture; custom footprints supply their own CAD. */
function bulletPcbBody(diameter: BulletDiameter, gender: BulletGender) {
  return {
    jscad: {
      type: "colorize",
      color: [0.83, 0.64, 0.22, 1],
      shape: {
        type: "cylinder",
        radius: (diameter + (gender === "male" ? 0.6 : 1)) / 2,
        height: diameter * 3.5,
        center: [0, 0, diameter * 1.75],
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
}: {
  diameter: BulletDiameter
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
          cadModel={bulletPcbBody(diameter, fromGender)}
          pcbX={-25}
          layer={layer}
          footprint={
            <footprint>
              <platedhole
                portHints={["pin1"]}
                holeDiameter={1.5}
                outerDiameter={3}
                shape="circle"
              />
            </footprint>
          }
        />
        <connector
          name="J2"
          standard="bullet"
          bulletDiameter={toDiameter}
          bulletGender={toGender}
          cadModel={bulletPcbBody(toDiameter, toGender)}
          pcbX={25}
          layer={layer}
          footprint={
            <footprint>
              <platedhole
                portHints={["pin1"]}
                holeDiameter={1.5}
                outerDiameter={3}
                shape="circle"
              />
            </footprint>
          }
        />
      </board>
      <assembly.cable name="POWER" from=".J1" to=".J2" standard="bullet" />
    </assembly.device>,
  )
  return circuit
}
