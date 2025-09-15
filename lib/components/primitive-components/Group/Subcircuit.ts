import { Group } from "./Group";
import { subcircuitProps } from "@tscircuit/props";
import type { z } from "zod";

export class Subcircuit extends Group {
  constructor(props: z.input<typeof subcircuitProps>) {
    super({
      ...props,
      subcircuit: true,
    });
  }
}

export interface SubcircuitGroupProps {
  showAsBox?: boolean;
  connections?: { [key: string]: string };
  schPinArrangement?: { [side: string]: { direction: string; pins: string[] } };
  schPinArrangementSize?: { [side: string]: number }; // if required
  schPinSpacing?: number;
  schPinStyle?: object;
  schWidth?: number;
  schHeight?: number;
  border?: { dashed?: boolean };
  [key: string]: unknown; // For any extra props
}
