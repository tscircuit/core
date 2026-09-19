export default function KeepoutWarningOnlyExample() {
  return (
    <board width={40} height={34} autorouter="default" schematicDisabled>
      <pcbnotetext
        text="KEEPOUTS: WARN OR BLOCK"
        pcbY={15}
        fontSize={0.9}
        color="white"
      />
      <pcbnotetext
        text={
          '<keepout shape="rect" width={4} height={6} warningOnly />\n<keepout shape="circle" radius={3} warningOnly />'
        }
        pcbX={-18}
        pcbY={13}
        anchorAlignment="top_left"
        fontSize={0.65}
        color="#ffd166"
      />
      <pcbnotetext text="TP1" pcbX={-7} pcbY={10} fontSize={0.6} />
      <testpoint name="TP1" footprintVariant="pad" pcbX={-7} pcbY={6} />
      <testpoint name="TP2" footprintVariant="pad" pcbX={14} pcbY={6} />
      <trace from=".TP1 > .pin1" to=".TP2 > .pin1" />
      <keepout
        shape="rect"
        width={4}
        height={6}
        pcbX={-7}
        pcbY={6}
        warningOnly
      />
      <keepout shape="circle" radius={3} pcbX={4} pcbY={6} warningOnly />
      <pcbnotetext
        text="TP1 inside + trace crossing: warnings, routing succeeds"
        pcbY={1}
        fontSize={0.65}
        color="#ffd166"
      />
      <pcbnotetext
        text={
          '<keepout shape="rect" width={6} height={6}\n  layers={["top", "bottom"]} />'
        }
        pcbX={-18}
        pcbY={-1}
        anchorAlignment="top_left"
        fontSize={0.65}
      />
      <testpoint name="TP3" footprintVariant="pad" pcbX={-14} pcbY={-8} />
      <testpoint name="TP4" footprintVariant="pad" pcbX={14} pcbY={-8} />
      <trace from=".TP3 > .pin1" to=".TP4 > .pin1" />
      <keepout
        shape="rect"
        width={6}
        height={6}
        pcbX={0}
        pcbY={-8}
        layers={["top", "bottom"]}
      />
      <pcbnotetext
        text="Normal keepout: trace routes around the region"
        pcbY={-14}
        fontSize={0.7}
      />
    </board>
  )
}
