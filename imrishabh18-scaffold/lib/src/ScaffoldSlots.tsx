import { PillHoleProps, PcbLayoutProps } from "@tscircuit/props"

interface ScaffoldSlotProps {
  pcbRotation?: string | number
  pcbX?: string | number
  pcbY?: string | number
}

export function Scaffold_Slot_Lrg_Single({
  pcbRotation = 0,
  pcbX = 0,
  pcbY = 0,
}: ScaffoldSlotProps) {
  return (
    <hole
      shape="pill"
      width="8mm"
      height="4mm"
      pcbX={pcbX}
      pcbY={pcbY}
      pcbRotation={pcbRotation}
    />
  )
}

export function Scaffold_Slot_Lrg_X_Set() {
  //formerly Scaffold_Slot_Base_Lrg_X_Set
  return (
    <footprint>
      <Scaffold_Slot_Lrg_Single key="TR" pcbX={8} pcbY={8} pcbRotation={45} />
      <Scaffold_Slot_Lrg_Single key="TL" pcbX={-8} pcbY={8} pcbRotation={-45} />
      <Scaffold_Slot_Lrg_Single key="BL" pcbX={-8} pcbY={-8} pcbRotation={45} />
      <Scaffold_Slot_Lrg_Single key="BR" pcbX={8} pcbY={-8} pcbRotation={-45} />
    </footprint>
  )
}

export function Scaffold_Slot_Med_X_Combined_Set() {
  return (
    //<chip name="">
    <footprint>
      <hole
        shape="pill"
        width="6.314mm"
        height="1.5mm"
        // pcbX={0}
        // pcbY={0}
        pcbRotation="45deg"
      />
      <hole
        shape="pill"
        width="6.314mm"
        height="1.5mm"
        // pcbX={0}
        // pcbY={0}
        pcbRotation="-45deg"
      />
    </footprint>
    //</chip>
  )
}

//export default Scaffold_Slot_Lrg_Single;
//export default Scaffold_Slot_Med_X_Combined_Set;
export default Scaffold_Slot_Lrg_X_Set
