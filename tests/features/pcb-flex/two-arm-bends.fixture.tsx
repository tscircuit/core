/** Board-local points in Circuit JSON coordinates (+X right, +Y top,
 * right-handed +Z above, mm). Each finite chord separates one narrow arm.
 */
export const twoArmOutline = [
  { x: -20, y: -10 },
  { x: 20, y: -10 },
  { x: 20, y: -4 },
  { x: 40, y: -4 },
  { x: 40, y: 4 },
  { x: 20, y: 4 },
  { x: 20, y: 10 },
  { x: 4, y: 10 },
  { x: 4, y: 30 },
  { x: -4, y: 30 },
  { x: -4, y: 10 },
  { x: -20, y: 10 },
]

export function TwoArmFlexBoard({
  folded,
  sideBendSide,
}: {
  folded: boolean
  sideBendSide: "left" | "right"
}) {
  return (
    <board
      material="flex"
      layers={2}
      thickness={0.12}
      routingDisabled
      outline={twoArmOutline}
    >
      {folded && (
        <>
          <pcbbend
            x1={-4}
            y1={20}
            x2={4}
            y2={20}
            bendAngle={90}
            bendRadius={1}
            bendSide="left"
          />
          <pcbbend
            x1={30}
            y1={-4}
            x2={30}
            y2={4}
            bendAngle={90}
            bendRadius={1}
            bendSide={sideBendSide}
          />
        </>
      )}
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={25} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={35} pcbY={0} />
      <resistor name="RB" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <silkscreentext
        text="R1"
        pcbX={0}
        pcbY={27.5}
        fontSize={1.6}
        anchorAlignment="center"
      />
      <silkscreentext
        text="R2"
        pcbX={35}
        pcbY={2.5}
        fontSize={1.6}
        anchorAlignment="center"
      />
      <silkscreentext
        text="BODY"
        pcbX={0}
        pcbY={2.5}
        fontSize={1.6}
        anchorAlignment="center"
      />
      <pcbnotetext
        text={
          sideBendSide === "right"
            ? "Both tips fold; body stays flat"
            : "Nested folds carry body; right tip stays flat"
        }
        pcbY={-8}
        fontSize={1}
      />
    </board>
  )
}
