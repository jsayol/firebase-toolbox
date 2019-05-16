import { UserEffects } from '../effects/user.effects';
import { WorkspacesEffects } from '../effects/workspaces.effects';
import { ProjectsEffects } from '../effects/projects.effects';

export const effects: any[] = [WorkspacesEffects, ProjectsEffects, UserEffects];
