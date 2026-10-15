// SW4 symbol copied from pico-pd-motor-lab/imports/JS202011JCQN.tsx.
// Keep its ports, coordinates, paths and text unchanged; put test notes outside it.

export const js202011jcqnPinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
} as const

export const js202011jcqnSymbol = (
  <symbol>
    {/* C&K contact numbering: common 2/6; OFF closes 1-2 and 5-6. */}
    <port
      name="pin1"
      pinNumber={1}
      direction="left"
      schX={-0.8}
      schY={0.7}
      schStemLength={0.2}
    />
    <port
      name="pin2"
      pinNumber={2}
      direction="right"
      schX={0.8}
      schY={0.4}
      schStemLength={0.2}
    />
    <port
      name="pin3"
      pinNumber={3}
      direction="left"
      schX={-0.8}
      schY={0.1}
      schStemLength={0.2}
    />
    <port
      name="pin5"
      pinNumber={5}
      direction="left"
      schX={-0.8}
      schY={-0.5}
      schStemLength={0.2}
    />
    <port
      name="pin6"
      pinNumber={6}
      direction="right"
      schX={0.8}
      schY={-0.8}
      schStemLength={0.2}
    />
    <port
      name="pin7"
      pinNumber={7}
      direction="left"
      schX={-0.8}
      schY={-1.1}
      schStemLength={0.2}
    />
    <schematicpath
      points={[
        { x: -0.6, y: 0.7 },
        { x: -0.4, y: 0.7 },
        { x: 0.4, y: 0.4 },
        { x: 0.6, y: 0.4 },
      ]}
    />
    <schematicpath
      points={[
        { x: -0.6, y: 0.1 },
        { x: -0.4, y: 0.1 },
      ]}
    />
    <schematicpath
      points={[
        { x: -0.6, y: -0.5 },
        { x: -0.4, y: -0.5 },
        { x: 0.4, y: -0.8 },
        { x: 0.6, y: -0.8 },
      ]}
    />
    <schematicpath
      points={[
        { x: -0.6, y: -1.1 },
        { x: -0.4, y: -1.1 },
      ]}
    />
    <schematicpath
      points={[
        { x: 0, y: 0.5 },
        { x: 0, y: 0.25 },
      ]}
    />
    <schematicpath
      points={[
        { x: 0, y: 0.05 },
        { x: 0, y: -0.2 },
      ]}
    />
    <schematicpath
      points={[
        { x: 0, y: -0.4 },
        { x: 0, y: -0.65 },
      ]}
    />
    <schematictext text="{NAME}" schX={0} schY={1.15} fontSize={0.2} />
    <schematictext
      text="DPDT • shown OFF"
      schX={0}
      schY={-1.5}
      fontSize={0.16}
    />
  </symbol>
)
