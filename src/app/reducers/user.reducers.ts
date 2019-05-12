import * as UserActions from '../actions/user.actions';

import { User } from '../models/user.model';

export type Action = UserActions.All;

export function userReducer(state: User, action: Action): User {
  switch (action.type) {
    case UserActions.GET_USER:
      return { ...state, loading: true };
      break;

    case UserActions.GET_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        info: action.payload,
        error: undefined
      };
      break;

    case UserActions.GET_USER_FAILURE:
      return {
        ...state,
        loading: false,
        info: null,
        error: action.payload
      };
      break;

    default:
      return state;
  }
}
