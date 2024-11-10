import React from "react";
import { HeatmapType } from "./page";

interface AppState {
  showHeatMap: boolean;
  heatmapType: HeatmapType;
  useZoomForRadius: boolean;
  radius: number;
  opacity: number;
}

type Action =
  | { type: "SET_SHOW_HEATMAP"; payload: boolean }
  | { type: "SET_HEATMAP_TYPE"; payload: HeatmapType }
  | { type: "USE_ZOOM_FOR_RADIUS"; payload: boolean }
  | { type: "SET_RADIUS"; payload: number }
  | { type: "SET_OPACITY"; payload: number };

const initialState: AppState = {
  showHeatMap: false,
  heatmapType: "duration",
  useZoomForRadius: true,
  radius: 25,
  opacity: 0.8,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_SHOW_HEATMAP":
      return { ...state, showHeatMap: action.payload };
    case "SET_HEATMAP_TYPE":
      return { ...state, heatmapType: action.payload };
    case "USE_ZOOM_FOR_RADIUS":
      return { ...state, useZoomForRadius: action.payload };
    case "SET_RADIUS":
      return { ...state, radius: action.payload };
    case "SET_OPACITY":
      return { ...state, opacity: action.payload };
    default:
      return state;
  }
}

const AppContext = React.createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export const AppProvider = function ({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }
  return context;
};
