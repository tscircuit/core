import type { AutorouterProp } from "@tscircuit/props"

export const DogboneViaSizePrecheckBoard = ({
  autorouter = "auto-local",
}: { autorouter?: AutorouterProp }) => (
  <board
    width={10}
    height={10}
    minTraceWidth={0.15}
    minTraceToPadEdgeClearance={0.1}
    minViaEdgeToPadEdgeClearance={0.1}
    minViaPadDiameter={0.6}
    minViaHoleDiameter={0.3}
    autorouter={autorouter}
  >
    <chip
      name="U1"
      footprint={
        <footprint>
          {[-1, 0, 1].flatMap((x) =>
            [-1, 0, 1].map((y) => (
              <smtpad
                portHints={[`${(x + 1) * 3 + y + 2}`]}
                pcbX={x * 0.65}
                pcbY={y * 0.65}
                shape="circle"
                radius={0.2}
              />
            )),
          )}
        </footprint>
      }
    />
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={3} />
    <trace from="U1.5" to="R1.1" />
    <pcbnotetext
      pcbY={3}
      text="Via 0.600mm exceeds 0.319mm dogbone gap; routing stopped"
      fontSize={0.35}
    />
  </board>
)
