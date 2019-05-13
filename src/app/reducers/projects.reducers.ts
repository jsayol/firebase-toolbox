import * as ProjectsActions from '../actions/projects.actions';

import { Projects } from '../models/projects.model';

export type Action = ProjectsActions.All;

export function projectsReducer(state: Projects, action: Action): Projects {
  switch (action.type) {
    case ProjectsActions.GET_LIST:
      return { ...state, loading: true, error: undefined };
      break;

    case ProjectsActions.GET_LIST_SUCCESS:
    case ProjectsActions.SET_LIST_AND_GET:
      return {
        ...state,
        loading: false,
        list: action.payload,
        error: undefined
      };
      break;

    case ProjectsActions.GET_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        list: [],
        error: action.payload
      };
      break;

    case ProjectsActions.SET_SELECTED:
      return { ...state, selected: action.payload };
      break;

    case ProjectsActions.GET_SELECTED:
    default:
      return state;
  }
}
