import { assembly, jscad } from "lib"
import { lampBase, LampStem, LampShade } from "./reference-surface-lamp"

/** Local right-handed XYZ, mm, +Z above. Mounts constrain the shade to Z=92
 * and cap to Z=112. Explosion declarations do not alter those assembled mounts.
 */
export function ExplosionLamp() {
  return (
    <assembly.device name="LAMP">
      <assembly.part name="BASE" cadModel={{ jscad: lampBase }}>
        <assembly.referencesurface name="stem" centerZOffset="12mm" />
      </assembly.part>
      <assembly.printedpart
        name="STEM"
        material="petg"
        color="#436f8b"
        jscad={<LampStem />}
        mountedTo="BASE.stem"
        mountFace="base"
      >
        <assembly.referencesurface name="base" normalDirection="z-" />
        <assembly.referencesurface name="shade" centerZOffset="80mm" />
        <assembly.part
          name="BULB"
          cadModel={{
            jscad: {
              type: "colorize",
              color: [1, 0.9, 0.65],
              shape: { type: "sphere", radius: 7, center: [0, 0, 88] },
            },
          }}
        />
        <assembly.subassembly name="COVER">
          <assembly.printedpart
            name="SHADE"
            material="pla"
            color="#d9a15f"
            jscad={<LampShade />}
            mountedTo="STEM.shade"
            mountFace="stem"
          >
            <assembly.referencesurface name="stem" normalDirection="z-" />
            <assembly.referencesurface name="cap" centerZOffset="20mm" />
          </assembly.printedpart>
          <assembly.printedpart
            name="CAP"
            material="pla"
            color="#e8c992"
            mountedTo="SHADE.cap"
            mountFace="bottom"
            jscad={
              <jscad.cylinder radius={20} height={3} center={[0, 0, 1.5]} />
            }
          >
            <assembly.referencesurface name="bottom" normalDirection="z-" />
          </assembly.printedpart>
          <assembly.explosion.stage name="remove-cap">
            <assembly.explosion.move targetRef="CAP" offZ="24mm" />
          </assembly.explosion.stage>
        </assembly.subassembly>
      </assembly.printedpart>
      <assembly.explosion.stage name="lift-cover">
        <assembly.explosion.move targetRef="STEM.COVER" offZ="50mm" />
      </assembly.explosion.stage>
      <assembly.explosion.stage
        name="park-cover"
        nextStageRef="STEM.COVER.remove-cap"
      >
        <assembly.explosion.move targetRef="STEM.COVER" offX="85mm" />
      </assembly.explosion.stage>
    </assembly.device>
  )
}
