import { Project } from "lib/Project"
import "lib/register-catalogue"
import "./extend-expect-circuit-snapshot"

export const getTestFixture = () => {
  const project = new Project()

  return { project }
}
