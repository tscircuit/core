import { assembly, jscad } from "lib"

const bossOutline = Array.from({ length: 40 }, (_, index): [number, number] => {
  const angle = (index * 2 * Math.PI) / 40
  return [2.65 * Math.cos(angle), 2.65 * Math.sin(angle)]
})

export default function PcbBossAssembly({
  bossX = 77.2,
}: { bossX?: number } = {}) {
  return (
    <assembly.device name="STRIP">
      <board width={150} height={14} thickness={1.6} routingDisabled />
      <assembly.printedpart
        name="BOSS"
        color="#3283b5"
        jscad={
          <jscad.translate offset={[bossX, 0, -3.5]}>
            <jscad.extrudeLinear height={6.65}>
              <jscad.polygon points={bossOutline} />
            </jscad.extrudeLinear>
          </jscad.translate>
        }
      />
      <assembly.explosion.stage name="lower-tray">
        <assembly.explosion.move targetRef="BOSS" offZ={-11} />
      </assembly.explosion.stage>
    </assembly.device>
  )
}
