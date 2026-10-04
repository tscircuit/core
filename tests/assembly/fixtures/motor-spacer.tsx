import { jscad } from "lib"

export const holeCenters = [-15.5, 15.5].flatMap((x) =>
  [-15.5, 15.5].map((y) => [x, y] as const),
)

/** Millimeters, right-handed XYZ. Plate rests on Z=0; posts extend toward +Z. */
export function SpacerSolid({ height = 10 }: { height?: number }) {
  if (!Number.isFinite(height) || height < 4)
    throw new Error("Spacer height must be at least the 4 mm plate thickness")
  return (
    <jscad.subtract>
      <jscad.union>
        <jscad.cuboid size={[42, 42, 4]} center={[0, 0, 2]} />
        {holeCenters.map(([x, y]) => (
          <jscad.cylinder
            key={`${x},${y}`}
            radius={4}
            height={height}
            center={[x, y, height / 2]}
          />
        ))}
      </jscad.union>
      <jscad.cylinder
        radius={15}
        height={height + 2}
        center={[0, 0, height / 2]}
      />
      {holeCenters.map(([x, y]) => (
        <jscad.cylinder
          key={`${x},${y}`}
          radius={1.6}
          height={height + 2}
          center={[x, y, height / 2]}
        />
      ))}
    </jscad.subtract>
  )
}

export function MotorSpacer({ height = 10 }: { height?: number }) {
  return (
    <>
      <SpacerSolid height={height} />
      <jscad.rotate angles={[0, Math.PI, 0]}>
        <jscad.rectangle name="motor" size={[42, 42]} reference />
      </jscad.rotate>
      <jscad.translate offset={[0, 0, height]}>
        <jscad.rectangle name="board" size={[42, 42]} reference />
      </jscad.translate>
    </>
  )
}
