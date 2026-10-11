export function ViaInner2PortsBoard() {
  return (
    <board width={20} height={12} layers={4} routeRemaining={false}>
      <via
        name="VA"
        pcbX={-2}
        pcbY={0}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.SIG"
      />
      <via
        name="VB"
        pcbX={2}
        pcbY={0}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.SIG"
      />
      <trace
        from="VA.inner2"
        to="VB.inner2"
        thickness={0.2}
        pcbPath={["VA.inner2", "VB.inner2"]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.6}
        text="Through vias should connect on inner2"
      />
    </board>
  )
}

export function ViaPortsEveryLayerBoard() {
  return (
    <board width={20} height={14} layers={4} routeRemaining={false}>
      <via
        name="TopA"
        pcbX={-2}
        pcbY={4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.TOP"
      />
      <via
        name="TopB"
        pcbX={2}
        pcbY={4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.TOP"
      />
      <trace
        from="TopA.top"
        to="TopB.top"
        thickness={0.2}
        pcbPath={["TopA.top", "TopB.top"]}
      />
      <pcbnotetext pcbX={-4} pcbY={4.5} fontSize={0.5} text="top" />

      <via
        name="Inner1A"
        pcbX={-2}
        pcbY={1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER1"
      />
      <via
        name="Inner1B"
        pcbX={2}
        pcbY={1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER1"
      />
      <trace
        from="Inner1A.inner1"
        to="Inner1B.inner1"
        thickness={0.2}
        pcbPath={["Inner1A.inner1", "Inner1B.inner1"]}
      />
      <pcbnotetext pcbX={-4} pcbY={1.5} fontSize={0.5} text="inner1" />

      <via
        name="Inner2A"
        pcbX={-2}
        pcbY={-1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER2"
      />
      <via
        name="Inner2B"
        pcbX={2}
        pcbY={-1.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.INNER2"
      />
      <trace
        from="Inner2A.inner2"
        to="Inner2B.inner2"
        thickness={0.2}
        pcbPath={["Inner2A.inner2", "Inner2B.inner2"]}
      />
      <pcbnotetext pcbX={-4} pcbY={-1.5} fontSize={0.5} text="inner2" />

      <via
        name="BottomA"
        pcbX={-2}
        pcbY={-4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.BOTTOM"
      />
      <via
        name="BottomB"
        pcbX={2}
        pcbY={-4.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        connectsTo="net.BOTTOM"
      />
      <trace
        from="BottomA.bottom"
        to="BottomB.bottom"
        thickness={0.2}
        pcbPath={["BottomA.bottom", "BottomB.bottom"]}
      />
      <pcbnotetext pcbX={-4} pcbY={-4.5} fontSize={0.5} text="bottom" />
    </board>
  )
}
