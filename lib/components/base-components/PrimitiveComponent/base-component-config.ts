import Debug from "debug"

import type { Ftype } from "lib/utils/constants"

import type { ZodType } from "zod"
import { z } from "zod"

export interface BaseComponentConfig {
  componentName: string
  schematicSymbolName?: string | null
  zodProps: z.ZodType
  sourceFtype?: Ftype | null
  shouldRenderAsSchematicBox?: boolean
}
