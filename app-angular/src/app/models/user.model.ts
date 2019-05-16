import { UserInfo } from '../providers/firebase-tools.service';

export interface User {
  loading: boolean;
  email: string | null;
  info: UserInfo | null;
}

export { UserInfo };
