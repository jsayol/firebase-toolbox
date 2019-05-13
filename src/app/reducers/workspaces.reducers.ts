import * as WorkspacesActions from '../actions/workspaces.actions';
import { Workspaces } from '../models/workspaces.model';

export type Action = WorkspacesActions.All;

export const initialState: Workspaces = {
  list: [],
  selected: null,
  loading: true
};

export function workspacesReducer(
  state: Workspaces = initialState,
  action: Action
): Workspaces {
  switch (action.type) {
    case WorkspacesActions.GET_LIST:
      return { ...state, loading: true };
      break;

    case WorkspacesActions.GET_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        list: action.payload
      };
      break;

    case WorkspacesActions.SET_SELECTED:
      return { ...state, selected: action.payload };
      break;

    case WorkspacesActions.GET_SELECTED:
    default:
      return state;
  }
}
