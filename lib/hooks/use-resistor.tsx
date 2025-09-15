import { resistorPins, type ResistorProps } from "@tscircuit/props";
import { createUseComponent } from "./create-use-component";

export const useResistor = createUseComponent(
  (props: ResistorProps) => <resistor {...props} />,
  resistorPins,
);
