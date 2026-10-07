import { assembly, jscad } from "lib"
import { Fragment } from "react"

/** Authored part-local XYZ in mm, right-handed +Z above. NEMA17 body is
 * centered at X=-65, behind its front face at Z=45. The board support is
 * centered at X=38, Z=8; named rectangles add no geometry.
 */
export function MotorControllerFrame() {
  return (
    <>
      <jscad.colorize color="#4e85b9">
        <jscad.subtract>
          <jscad.union>
            <jscad.cuboid size={[154, 58, 4]} center={[-17, 0, 2]} />
            <jscad.subtract>
              <jscad.cuboid size={[54, 54, 41]} center={[-65, 0, 24.5]} />
              <jscad.cuboid size={[46, 46, 43]} center={[-65, 0, 24.5]} />
            </jscad.subtract>
            <jscad.cuboid size={[54, 54, 4]} center={[-65, 0, 47]} />
            {[-18, 18].flatMap((x) =>
              [-12, 12].map((y) => (
                <jscad.cylinder
                  key={`${x},${y}`}
                  radius={3.5}
                  height={8}
                  center={[38 + x, y, 4]}
                />
              )),
            )}
          </jscad.union>
          <jscad.cylinder radius={12} height={8} center={[-65, 0, 47]} />
          {/* Cable window aligned with the motor's +X wireside. */}
          <jscad.cuboid size={[10, 20, 12]} center={[-40, 0, 10]} />
          {[-15.5, 15.5].flatMap((x) =>
            [-15.5, 15.5].map((y) => (
              <jscad.cylinder
                key={`${x},${y}`}
                radius={1.6}
                height={8}
                center={[-65 + x, y, 47]}
              />
            )),
          )}
          {[-18, 18].flatMap((x) =>
            [-12, 12].map((y) => (
              <jscad.cylinder
                key={`${x},${y}`}
                radius={1.6}
                height={10}
                center={[38 + x, y, 4]}
              />
            )),
          )}
        </jscad.subtract>
      </jscad.colorize>
      <jscad.translate offset={[-65, 0, 45]}>
        <jscad.rotate angles={[Math.PI, 0, 0]}>
          <jscad.rectangle name="motor" reference size={[42, 42]} />
        </jscad.rotate>
      </jscad.translate>
      <jscad.translate offset={[38, 0, 8]}>
        <jscad.rectangle name="controller" reference size={[48, 34]} />
      </jscad.translate>
    </>
  )
}

export function CabledMotorController() {
  return (
    <assembly.device>
      <assembly.printedpart name="FRAME" jscad={<MotorControllerFrame />}>
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          wireConnection="jst6_ph"
          mountedTo="FRAME.motor"
          mountFace="frontface"
        />
      </assembly.printedpart>
      <board
        name="CONTROLLER"
        width={48}
        height={34}
        thickness={1.6}
        pcbX={38}
        mountedTo="FRAME.controller"
        routingDisabled
      >
        <connector
          name="J_MOTOR"
          standard="jst_ph"
          pinCount={6}
          pcbX={-18}
          pcbRotation={90}
          footprint="jst6_ph"
        />
        <chip
          name="U_DRIVER"
          footprint="soic8"
          pinLabels={{
            pin1: "OUT1",
            pin2: "OUT2",
            pin3: "OUT3",
            pin4: "OUT4",
            pin5: "OUT5",
            pin6: "OUT6",
            pin7: "VM",
            pin8: "GND",
          }}
        />
        {[-18, 18].flatMap((x) =>
          [-12, 12].map((y) => (
            <Fragment key={`${x},${y}`}>
              <hole pcbX={x} pcbY={y} diameter={3.2} />
            </Fragment>
          )),
        )}
      </board>
      <assembly.cable
        name="MOTOR_CABLE"
        from="MOTOR.wireside"
        to=".CONTROLLER > .J_MOTOR"
      />
    </assembly.device>
  )
}
