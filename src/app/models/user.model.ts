import { UserInfo } from '../providers/firebase-tools.service';

export interface User {
  loading: boolean;
  info: UserInfo;
  error?: Error;
}

export { UserInfo as UserDetails };
