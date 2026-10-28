import Debug from "debug"

import { Port } from "../../primitive-components/Port"

export type PortMap<T extends string> = {
  [K in T]: Port
}
