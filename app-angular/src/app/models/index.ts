import { User } from "./user.model";
import { Workspaces } from "./workspaces.model";
import { Projects } from "./projects.model";

export interface AppState {
  user: User;
  workspaces: Workspaces;
  projects: Projects
}
