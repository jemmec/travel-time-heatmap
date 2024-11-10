import React from "react";
import { useApp } from "./context";

export const Controls = React.memo(function Controls(): React.ReactNode {
  const app = useApp();

  return (
    <div className="bg-black bg-opacity-55 p-2">
      <div className="flex justify-between gap-4">
        <label className="text-white" htmlFor="showHeatMap">
          Show Heatmap
        </label>
        <input
          id="showHeatMap"
          type="checkbox"
          checked={app.state.showHeatMap}
          onChange={(e) =>
            app.dispatch({
              type: "SET_SHOW_HEATMAP",
              payload: e.target.checked,
            })
          }
        />
      </div>

      <div className="flex justify-between gap-4">
        <label className="text-white" htmlFor="heatmapType">
          Heatmap Type
        </label>
        <select
          id="heatmapType"
          value={app.state.heatmapType}
          onChange={(e) =>
            app.dispatch({
              type: "SET_HEATMAP_TYPE",
              payload: e.target.value as "distance" | "duration",
            })
          }
        >
          <option value="distance">Distance</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      <div className="flex justify-between gap-4">
        <label className="text-white" htmlFor="useZoomForRadius">
          Get Radius from Zoom
        </label>
        <input
          id="useZoomForRadius"
          type="checkbox"
          checked={app.state.useZoomForRadius}
          onChange={(e) =>
            app.dispatch({
              type: "USE_ZOOM_FOR_RADIUS",
              payload: e.target.checked,
            })
          }
        />
      </div>

      <div className="flex justify-between gap-4">
        <label className="text-white" htmlFor="radius">
          Radius (metres)
        </label>
        <input
          disabled={app.state.useZoomForRadius}
          id="radius"
          type="range"
          min={5}
          max={200}
          step={1}
          value={app.state.radius}
          onChange={(e) =>
            app.dispatch({
              type: "SET_RADIUS",
              payload: Number(e.target.value),
            })
          }
        />
        <span className="text-white">{app.state.radius}</span>
      </div>

      <div className="flex justify-between gap-4">
        <label className="text-white" htmlFor="opacity">
          Opacity
        </label>
        <input
          id="opacity"
          type="range"
          min={0}
          max={1}
          step="0.1"
          value={app.state.opacity}
          onChange={(e) =>
            app.dispatch({
              type: "SET_OPACITY",
              payload: Number(e.target.value),
            })
          }
        />
        <span className="text-white">{app.state.opacity.toFixed(1)}</span>
      </div>
    </div>
  );
});
