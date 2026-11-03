import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import type { PcbPath } from "@tscircuit/props"

function inComponentFrame(
  path: PcbPath,
  origin: { x: number; y: number; ccwRotationDegrees?: number },
): PcbPath {
  const boardToComponentTransform = compose(
    rotateDEG(-(origin.ccwRotationDegrees ?? 0)),
    translate(-origin.x, -origin.y),
  )
  return path.flatMap<PcbPath[number]>((point) => {
    if (typeof point === "string") return [point]
    const componentPoint = applyToPoint(boardToComponentTransform, {
      x: Number(point.x),
      y: Number(point.y),
    })
    const translated = { ...point, ...componentPoint }
    return point.via
      ? [{ ...componentPoint }, translated, { ...componentPoint }]
      : [translated]
  })
}

export function UsbRouting() {
  return (
    <>
      <trace
        name="usb_dp_series"
        from=".U1 > .IO20"
        to=".R58 > .pin1"
        thickness="0.28mm"
        pcbPath={[".U1 > .IO20", ".R58 > .pin1"]}
      />
      <trace
        name="usb_dm_series"
        from=".U1 > .IO19"
        to=".R59 > .pin1"
        thickness="0.28mm"
        pcbPath={[".U1 > .IO19", ".R59 > .pin1"]}
      />
      <trace
        name="usb_dp_host"
        from=".R58 > .pin2"
        to=".U9 > .pin6"
        thickness="0.28mm"
        pcbPath={inComponentFrame(
          [
            ".R58 > .pin2",
            {
              x: 14.4,
              y: 19.5349527,
              via: true,
              fromLayer: "bottom",
              toLayer: "top",
            },
            { x: 22.2, y: 19.5349527 },
            { x: 25.2, y: 16.5349527 },
            { x: 25.2, y: -23.35 },
            { x: 23.4, y: -25.15 },
            { x: 16.05004, y: -25.15 },
            ".U9 > .pin6",
          ],
          { x: 12, y: 19.4349527, ccwRotationDegrees: 180 },
        )}
      />
      <trace
        name="usb_dm_host"
        from=".R59 > .pin2"
        to=".U9 > .pin4"
        thickness="0.28mm"
        pcbPath={inComponentFrame(
          [
            ".R59 > .pin2",
            {
              x: 14.4,
              y: 20.8049527,
              via: true,
              fromLayer: "bottom",
              toLayer: "top",
            },
            { x: 22.3776, y: 20.8049527 },
            { x: 25.63, y: 17.5525527 },
            { x: 25.63, y: -23.528 },
            { x: 23.578, y: -25.58 },
            { x: 19.220864, y: -25.58 },
            ".U9 > .pin4",
          ],
          { x: 12, y: 20.9049527, ccwRotationDegrees: 180 },
        )}
      />
      <trace
        name="usb_dp_socket"
        from=".U9 > .pin1"
        to=".J2 > .DP1"
        thickness="0.28mm"
        pcbPath={inComponentFrame(
          [
            ".U9 > .pin1",
            { x: 16.05004, y: -30.149096 },
            { x: 13.750064, y: -32.449072 },
            ".J2 > .DP1",
          ],
          { x: 17, y: -28 },
        )}
      />
      <trace
        name="usb_dp_reversible"
        from=".J2 > .DP1"
        to=".J2 > .DP2"
        thickness="0.2mm"
        pcbPath={inComponentFrame(
          [
            ".J2 > .DP1",
            { x: 13.750064, y: -33.9 },
            { x: 15.5, y: -33.9 },
            { x: 15.5, y: -34.45 },
            { x: 14.750062, y: -35.2 },
            ".J2 > .DP2",
          ],
          { x: 14, y: -38 },
        )}
      />
      <trace
        name="usb_dm_socket"
        from=".U9 > .pin3"
        to=".J2 > .DN1"
        thickness="0.2mm"
        pcbPath={inComponentFrame(
          [
            ".U9 > .pin3",
            { x: 17.94996, y: -30.149096 },
            { x: 14.65, y: -33.449056 },
            {
              x: 14.65,
              y: -33.1,
              via: true,
              fromLayer: "top",
              toLayer: "bottom",
            },
            { x: 14.5, y: -33.9 },
            {
              x: 14.5,
              y: -34.7,
              via: true,
              fromLayer: "bottom",
              toLayer: "top",
            },
            { x: 14.5, y: -34.95 },
            { x: 14.249936, y: -35.200064 },
            ".J2 > .DN1",
          ],
          { x: 17, y: -28 },
        )}
      />
      <trace
        name="usb_dm_reversible"
        from=".J2 > .DN1"
        to=".J2 > .DN2"
        thickness="0.2mm"
        pcbPath={inComponentFrame(
          [
            ".J2 > .DN1",
            { x: 14.249936, y: -35.200064 },
            { x: 14.5, y: -34.95 },
            {
              x: 14.5,
              y: -34.7,
              via: true,
              fromLayer: "top",
              toLayer: "bottom",
            },
            { x: 13.75, y: -34.7 },
            { x: 13, y: -34.7, via: true, fromLayer: "bottom", toLayer: "top" },
            { x: 13, y: -34.950062 },
            { x: 13.249938, y: -35.2 },
            ".J2 > .DN2",
          ],
          { x: 14, y: -38 },
        )}
      />
    </>
  )
}
