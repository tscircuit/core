import { ledPins, type LedProps } from "@tscircuit/props";
import { createUseComponent } from "./create-use-component";

export const useLed = createUseComponent(
  (props: LedProps) => <led {...props} />,
  ledPins,
);
