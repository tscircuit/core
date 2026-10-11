import { assembly, jscad } from "lib"
import type { JscadOperation } from "jscad-planner"

/** Part-local, right-handed XYZ in mm, +Z up. The base's top is Z=12;
 * the stem is 80 mm tall. The shade's mounting collar starts at its local Z=0,
 * with an open tapered shell spanning Z=-24..20. Reference frames add no mesh.
 */
export const lampBase: JscadOperation = {
  type: "colorize",
  color: [0.08, 0.12, 0.16],
  shape: {
    type: "subtract",
    shapes: [
      {
        type: "union",
        shapes: [
          { type: "cylinder", radius: 34, height: 8, center: [0, 0, 4] },
          { type: "cylinder", radius: 24, height: 4, center: [0, 0, 10] },
        ],
      },
      { type: "cylinder", radius: 2, height: 14, center: [0, 0, 6] },
      {
        type: "translate",
        vector: [17, 0, 1],
        shape: { type: "cuboid", size: [34, 4, 3] },
      },
    ],
  },
}

export function LampStem() {
  return (
    <jscad.colorize color="#436f8b">
      <jscad.subtract>
        <jscad.cylinder radius={4} height={80} center={[0, 0, 40]} />
        <jscad.cylinder radius={2} height={82} center={[0, 0, 40]} />
      </jscad.subtract>
    </jscad.colorize>
  )
}

export function LampShade() {
  return (
    <jscad.colorize color="#d9a15f">
      <jscad.union>
        <jscad.subtract>
          <jscad.hull>
            <jscad.cylinder radius={36} height={0.2} center={[0, 0, -23.9]} />
            <jscad.cylinder radius={20} height={0.2} center={[0, 0, 19.9]} />
          </jscad.hull>
          <jscad.hull>
            <jscad.cylinder radius={34.4} height={0.2} center={[0, 0, -25]} />
            <jscad.cylinder radius={17.6} height={0.2} center={[0, 0, 21]} />
          </jscad.hull>
        </jscad.subtract>
        <jscad.subtract>
          <jscad.cylinder radius={7} height={4} center={[0, 0, 2]} />
          <jscad.cylinder radius={2.2} height={6} center={[0, 0, 2]} />
        </jscad.subtract>
        {[0, 120, 240].map((angle) => (
          <jscad.rotate key={angle} angles={[0, 0, (angle * Math.PI) / 180]}>
            <jscad.cuboid size={[20, 2, 2]} center={[16, 0, 2]} />
          </jscad.rotate>
        ))}
      </jscad.union>
    </jscad.colorize>
  )
}

export function ReferenceSurfaceLamp({ shadeGap = 0 }: { shadeGap?: number }) {
  return (
    <assembly.device name="LAMP">
      <assembly.part name="BASE" cadModel={{ jscad: lampBase }}>
        <assembly.referencesurface
          name="stem"
          width="28mm"
          height="28mm"
          centerZOffset="12mm"
        />
      </assembly.part>
      <assembly.printedpart
        name="STEM"
        material="petg"
        color="#436f8b"
        jscad={<LampStem />}
        mountedTo="BASE.stem"
        mountFace="base"
      >
        <assembly.referencesurface
          name="base"
          width="28mm"
          height="28mm"
          normalDirection="z-"
        />
        <assembly.referencesurface
          name="shade"
          width="28mm"
          height="28mm"
          centerZOffset="80mm"
        />
        <assembly.part
          name="BULB"
          cadModel={{
            jscad: {
              type: "colorize",
              color: [1, 0.9, 0.65],
              shape: {
                type: "union",
                shapes: [
                  {
                    type: "cylinder",
                    radius: 2,
                    height: 8,
                    center: [0, 0, 84],
                  },
                  { type: "sphere", radius: 7, center: [0, 0, 88] },
                ],
              },
            },
          }}
        />
      </assembly.printedpart>
      <assembly.printedpart
        name="SHADE"
        material="pla"
        color="#d9a15f"
        jscad={<LampShade />}
        mountedTo="STEM.shade"
        mountFace="stem"
        mountGap={shadeGap}
      >
        <assembly.referencesurface
          name="stem"
          width="28mm"
          height="28mm"
          normalDirection="z-"
        />
      </assembly.printedpart>
    </assembly.device>
  )
}
