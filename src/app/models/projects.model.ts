import { FirebaseProject } from '../providers/firebase-tools.service';

export interface Projects {
  loading: boolean;
  list: FirebaseProject[];
  selected: FirebaseProject | null;
  error?: Error;
}

export { FirebaseProject };
