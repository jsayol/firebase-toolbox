import { Workspace } from '../providers/firebase-tools.service';

export interface Workspaces {
  loading: boolean;
  list: Workspace[];
  selected: Workspace | null;
}

export { Workspace };
