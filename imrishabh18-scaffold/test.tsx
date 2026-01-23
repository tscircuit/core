/*
import { Molecule } from "@tsci/adom-inc.molecule"

export default () => (
    <Molecule
      type="4pin"
      size="16x16"
      pinType="MachinePinMediumStandard"
      wing="nominal"
      roundEdges={true}
    >
    </Molecule>
)
*/

import { Molecule8x8MedShort } from "@tsci/imrishabh18.molecule"

import { MachineContactMedium } from "@tsci/imrishabh18.library"

export default () => (
  <Molecule8x8MedShort>
    <MachineContactMedium name="MC1" />
  </Molecule8x8MedShort>
)
