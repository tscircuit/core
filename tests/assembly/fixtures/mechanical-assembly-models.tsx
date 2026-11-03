import { assembly, jscad } from "lib"
import { renderToJscadPlan } from "jscad-fiber/headless"

// All solids are in right-handed part-local XYZ, mm, +Z above. Offsets below
// describe machining features within a part; assembly placement uses faces.
export const mechanicalPlan = renderToJscadPlan
export const silver = "#a9b6c1"
export const blue = "#2879b7"
export const orange = "#df7929"

export function SlottedPlate({ color = silver }: { color?: string }) {
  return (
    <jscad.colorize color={color}>
      <jscad.subtract>
        <jscad.roundedCuboid
          size={[60, 60, 6]}
          center={[0, 0, -3]}
          roundRadius={1}
        />
        <jscad.cylinder radius={12} height={10} center={[0, 0, -3]} />
        {[-15.5, 15.5].flatMap((x) =>
          [-15.5, 15.5].map((y) => (
            <jscad.hull key={`${x},${y}`}>
              <jscad.cylinder radius={2} height={10} center={[x, y - 6, -3]} />
              <jscad.cylinder radius={2} height={10} center={[x, y + 6, -3]} />
            </jscad.hull>
          )),
        )}
      </jscad.subtract>
    </jscad.colorize>
  )
}

/** Recognizable 2020-style extrusion with four T slots and a central bore. */
function Extrusion({ length }: { length: number }) {
  return (
    <jscad.colorize color={silver}>
      <jscad.subtract>
        <jscad.cuboid size={[20, 20, length]} />
        <jscad.cylinder radius={2.1} height={length + 2} />
        {[0, 1, 2, 3].map((side) => (
          <jscad.rotate key={side} angles={[0, 0, (side * Math.PI) / 2]}>
            <jscad.cuboid size={[6, 4, length + 2]} center={[0, 9, 0]} />
            <jscad.cuboid size={[10, 3, length + 2]} center={[0, 6, 0]} />
          </jscad.rotate>
        ))}
      </jscad.subtract>
    </jscad.colorize>
  )
}

export function GantryFrame() {
  return (
    <jscad.colorize color={silver}>
      <jscad.union>
        <jscad.translate offset={[0, 0, 120]}>
          <jscad.rotate angles={[0, Math.PI / 2, 0]}>
            <Extrusion length={160} />
          </jscad.rotate>
        </jscad.translate>
        {[-70, 70].map((x) => (
          <jscad.translate key={x} offset={[x, 0, 60]}>
            <Extrusion length={100} />
          </jscad.translate>
        ))}
        <jscad.colorize color="#4a515c">
          <jscad.subtract>
            <jscad.cuboid size={[180, 100, 10]} center={[0, 25, 5]} />
            {[-60, -30, 0, 30, 60].map((x) => (
              <jscad.cuboid key={x} size={[3, 94, 2]} center={[x, 25, 10]} />
            ))}
          </jscad.subtract>
        </jscad.colorize>
        <jscad.colorize color="#d4dce1">
          <jscad.subtract>
            <jscad.cuboid size={[144, 5, 12]} center={[0, 12, 120]} />
            {[-60, -40, -20, 0, 20, 40, 60].map((x) => (
              <jscad.translate key={x} offset={[x, 12, 120]}>
                <jscad.rotate angles={[Math.PI / 2, 0, 0]}>
                  <jscad.cylinder radius={1.6} height={8} />
                </jscad.rotate>
              </jscad.translate>
            ))}
          </jscad.subtract>
        </jscad.colorize>
      </jscad.union>
    </jscad.colorize>
  )
}

/** Centered CAD mesh. The part applies a +7Y CAD offset so its rear is at
 * source-part Y=0 and the tool's mating face at Y=14. */
export function LinearCarriage() {
  return (
    <jscad.colorize color={blue}>
      <jscad.union>
        <jscad.colorize color={blue}>
          <jscad.subtract>
            <jscad.cuboid size={[42, 14, 36]} center={[0, 0, 0]} />
            <jscad.cuboid size={[44, 6, 14]} center={[0, -6, 0]} />
            {[-14, 14].flatMap((x) =>
              [-12, 12].map((z) => (
                <jscad.translate key={`${x},${z}`} offset={[x, 0, z]}>
                  <jscad.rotate angles={[Math.PI / 2, 0, 0]}>
                    <jscad.cylinder radius={2} height={18} />
                  </jscad.rotate>
                </jscad.translate>
              )),
            )}
          </jscad.subtract>
        </jscad.colorize>
        {[-22, 22].map((x) => (
          <jscad.colorize key={x} color="#a93533">
            <jscad.cuboid size={[3, 12, 32]} center={[x, 0, 0]} />
          </jscad.colorize>
        ))}
      </jscad.union>
    </jscad.colorize>
  )
}

export function SpindleClamp() {
  return (
    <jscad.colorize color={orange}>
      <jscad.subtract>
        <jscad.cuboid size={[50, 42, 18]} center={[0, 21, 0]} />
        <jscad.cylinder radius={16.3} height={22} center={[0, 22, 0]} />
        <jscad.cuboid size={[2, 15, 22]} center={[0, 39, 0]} />
        {[-20, 20].map((x) => (
          <jscad.cylinder key={x} radius={2} height={22} center={[x, 7, 0]} />
        ))}
      </jscad.subtract>
    </jscad.colorize>
  )
}

/** Separate physical parts retain their materials after JSCAD export. */
export function SpindleDetails() {
  return (
    <>
      <assembly.part
        name="MOTOR_BODY"
        cadModel={{
          jscad: mechanicalPlan(
            <jscad.colorize color="#c2c9cf">
              <jscad.cylinder radius={16} height={70} center={[0, 22, -25]} />
            </jscad.colorize>,
          ),
        }}
      />
      <assembly.part
        name="COLLET"
        cadModel={{
          jscad: mechanicalPlan(
            <jscad.colorize color="#424a52">
              <jscad.cylinder radius={11} height={15} center={[0, 22, -67.5]} />
            </jscad.colorize>,
          ),
        }}
      />
      <assembly.part
        name="CUTTER"
        cadModel={{
          jscad: mechanicalPlan(
            <jscad.colorize color="#b88d3f">
              <jscad.cylinder radius={3} height={18} center={[0, 22, -84]} />
            </jscad.colorize>,
          ),
        }}
      />
    </>
  )
}

/** Angle bracket occupies X[-27,27], Y[-32,32], Z[0,70]. */
export function AngleBracket() {
  return (
    <jscad.colorize color={silver}>
      <jscad.subtract>
        <jscad.union>
          <jscad.cuboid size={[54, 64, 4]} center={[0, 0, 2]} />
          <jscad.cuboid size={[54, 4, 70]} center={[0, -30, 35]} />
        </jscad.union>
        {[-17, 17].map((x) => (
          <jscad.hull key={x}>
            <jscad.cylinder radius={3} height={8} center={[x, -12, 2]} />
            <jscad.cylinder radius={3} height={8} center={[x, 18, 2]} />
          </jscad.hull>
        ))}
        <jscad.translate offset={[0, -30, 42]}>
          <jscad.rotate angles={[Math.PI / 2, 0, 0]}>
            <jscad.cylinder radius={12} height={8} />
            {[-15.5, 15.5].flatMap((x) =>
              [-15.5, 15.5].map((y) => (
                <jscad.cylinder
                  key={`${x},${y}`}
                  radius={2}
                  height={8}
                  center={[x, y, 0]}
                />
              )),
            )}
          </jscad.rotate>
        </jscad.translate>
      </jscad.subtract>
    </jscad.colorize>
  )
}

export function EnclosureTray() {
  return (
    <jscad.colorize color="#475565">
      <jscad.subtract>
        <jscad.union>
          <jscad.subtract>
            <jscad.cuboid size={[56, 36, 18]} center={[0, 0, -9]} />
            <jscad.cuboid size={[51, 31, 18]} center={[0, 0, -6.5]} />
          </jscad.subtract>
          {[-20, 20].flatMap((x) =>
            [-12, 12].map((y) => (
              <jscad.cylinder
                key={`${x},${y}`}
                radius={3.5}
                height={16}
                center={[x, y, -8]}
              />
            )),
          )}
        </jscad.union>
        {[-20, 20].flatMap((x) =>
          [-12, 12].map((y) => (
            <jscad.cylinder
              key={`${x},${y}`}
              radius={1.25}
              height={20}
              center={[x, y, -8]}
            />
          )),
        )}
      </jscad.subtract>
    </jscad.colorize>
  )
}

export function EnclosureCover() {
  return (
    <jscad.colorize color={orange}>
      <jscad.subtract>
        <jscad.cuboid size={[56, 36, 4]} center={[0, 0, 2]} />
        {[-20, 20].flatMap((x) =>
          [-12, 12].map((y) => (
            <jscad.cylinder
              key={`${x},${y}`}
              radius={1.7}
              height={8}
              center={[x, y, 2]}
            />
          )),
        )}
        {[-12, -6, 0, 6, 12].map((x) => (
          <jscad.cuboid key={x} size={[2.5, 16, 8]} center={[x, 0, 2]} />
        ))}
      </jscad.subtract>
    </jscad.colorize>
  )
}

/** Pinned JSCAD Electronics assets, part-local right-handed XYZ in mm. */
export const loadMechanicalModel = async (
  name: "m3_socket_head" | "soic8_driver" | "pinrow8_header",
) => {
  const filename = {
    m3_socket_head: "m3-socket-head.glb.gz",
    soic8_driver: "soic8-driver.glb.gz",
    pinrow8_header: "pinrow8-header.glb.gz",
  }[name]
  const data = await Bun.file(new URL(filename, import.meta.url)).arrayBuffer()
  return {
    glbUrl: `data:model/gltf-binary;base64,${Buffer.from(Bun.gunzipSync(new Uint8Array(data))).toString("base64")}`,
  }
}
