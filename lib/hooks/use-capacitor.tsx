import { capacitorPins, type CapacitorProps } from "@tscircuit/props";
import { createUseComponent } from "./create-use-component";

export const useCapacitor = createUseComponent(
  (props: CapacitorProps) => <capacitor {...props} />,
  capacitorPins,
);
