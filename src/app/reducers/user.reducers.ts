import * as UserActions from '../actions/user.actions';
import { User } from '../models/user.model';

export type Action = UserActions.All;

export const initialState: User = {
  email: null,
  info: null,
  loading: true
};

export function userReducer(state: User = initialState, action: Action): User {
  switch (action.type) {
    case UserActions.GET_USER_EMAIL:
      return { ...state, email: null, loading: true };
      break;

    case UserActions.SET_USER_EMAIL:
      return {
        ...state,
        email: action.payload,
        loading: false
      };
      break;

    case UserActions.GET_USER_INFO_SUCCESS:
      return {
        ...state,
        info: action.payload
      };
      break;

    // case UserActions.GET_USER_INFO_FAILURE:
    //   return {
    //     ...state,
    //     error: action.payload
    //   };
    //   break;

    default:
      return state;
  }
}
