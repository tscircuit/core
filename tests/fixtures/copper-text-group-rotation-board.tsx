export const CopperTextGroupRotationBoard = () => (
  <board width="28mm" height="18mm" routingDisabled>
    <silkscreentext text="5V LABELS / GROUP ROTATION" pcbY={7} fontSize={0.8} />
    {[0, 90, 180, 270].map((pcbRotation, column) => (
      <group
        name={`Legend${pcbRotation}`}
        key={pcbRotation}
        pcbX={-9 + column * 6}
        pcbY={0}
        pcbRotation={pcbRotation}
      >
        <coppertext text="5V" fontSize={1} />
        <silkscreentext text="5V" fontSize={1} pcbY={2} />
      </group>
    ))}
    {[0, 90, 180, 270].map((rotation, column) => (
      <silkscreentext
        key={rotation}
        text={`${rotation} deg`}
        pcbX={-9 + column * 6}
        pcbY={-6}
        fontSize={0.8}
      />
    ))}
  </board>
)
