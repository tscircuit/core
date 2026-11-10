export function NoMeanderDifferentialPairBoard({
  routingDisabled = false,
}: { routingDisabled?: boolean }) {
  return (
    <board
      width={24}
      height={2}
      schematicDisabled
      autorouter="auto_local"
      routingDisabled={routingDisabled}
    >
      {[
        { name: "P_START", x: -10.6, y: 0.5 },
        { name: "P_END", x: 10.6, y: 0.5 },
        { name: "N_START", x: -10, y: -0.5 },
        { name: "N_END", x: 10, y: -0.5 },
      ].map(({ name, x, y }) => (
        <chip
          key={name}
          name={name}
          pcbX={x}
          pcbY={y}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                width={0.2}
                height={0.2}
                shape="rect"
              />
            </footprint>
          }
        />
      ))}
      <keepout
        shape="rect"
        pcbY={0}
        width={24}
        height={0.3}
        layers={["top", "bottom"]}
      />
      <keepout
        shape="rect"
        pcbY={-1.1}
        width={24}
        height={0.7}
        layers={["top", "bottom"]}
      />
      <trace name="P" from=".P_START > .pin1" to=".P_END > .pin1" />
      <trace name="N" from=".N_START > .pin1" to=".N_END > .pin1" />
      <differentialpair
        name="USB"
        positiveConnection="P"
        negativeConnection="N"
        maxLengthSkew={0.1}
      />
    </board>
  )
}
