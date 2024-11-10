"use client";

import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import React from "react";
import { Controls } from "./controls";
import { AppProvider, useApp } from "./context";
import { appendFileSync } from "fs";

type Coordinates = [number, number];

export type HeatmapType = "distance" | "duration";

type DistancesMeta = {
  readonly destination: Coordinates;
  readonly density: number;
  readonly radius: number;
  readonly arrivalTime: number;
  readonly count: number;
};

type DataPoint = {
  readonly text: string;
  readonly value: number;
};

type Element = {
  readonly distance: DataPoint;
  readonly duration: DataPoint;
  readonly status: "OK";
};

type EmptyElement = {
  readonly status: "ZERO_RESULTS";
};

type Row = {
  readonly elements: ReadonlyArray<Element | EmptyElement>;
};

type DistancePoint = {
  readonly destination_coords: Coordinates;
  readonly origin_coords: Coordinates;
  readonly destination_addresses: ReadonlyArray<string>;
  readonly origin_addresses: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<Row>;
  readonly status: string;
};

type DistancesData = {
  readonly meta: DistancesMeta;
  readonly distances: ReadonlyArray<DistancePoint>;
};

// react-google-maps doesn't expose the type so I'll do it manually
type LatLngLiteral = {
  lat: number;
  lng: number;
};

/**
 * Converts a [number, number] to a lat lng object
 * @param inCoord the original array coordinate
 * @returns the LatLngLiteral object
 */
function toLatLngLiteral(inCoord: [number, number]): LatLngLiteral {
  return { lat: inCoord[0], lng: inCoord[1] };
}

function calculateZoomLevel(radius: number, buffer: number): number {
  const earthCircumference = 40075017; // Earth's circumference in meters
  const adjustedRadius = radius * (1 + buffer / 100);
  const requiredMapWidth = adjustedRadius * 2;
  const zoom = Math.log2(earthCircumference / requiredMapWidth);
  return Math.floor(zoom);
}

export default function Index() {
  const apiKey: string | undefined = process.env.NEXT_PUBLIC_API_KEY;

  if (apiKey == undefined) {
    console.warn("No google api key present");
    return <React.Fragment />;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <AppProvider>
        <View />
      </AppProvider>
    </APIProvider>
  );
}

const DEFAULT_ZOOM = 3;

const View = React.memo(function View() {
  const map = useMap();
  const app = useApp();
  const [data, setData] = React.useState<DistancesData | undefined>(undefined);
  const [zoom, setZoom] = React.useState<number>(DEFAULT_ZOOM);

  const radius = React.useMemo(() => {
    if (!app.state.useZoomForRadius) {
      return app.state.radius;
    }

    return 25 + zoom;
  }, [app.state.useZoomForRadius, zoom]);

  /**
   * Side-effect for inital setup of the map when new data is loaded
   */
  React.useEffect(() => {
    if (!map || !data) {
      return;
    }
    map.setCenter(toLatLngLiteral(data.meta.destination));
    map.setZoom(calculateZoomLevel(data.meta.radius, 10));
  }, [map, data]);

  return (
    <React.Fragment>
      <Map
        mapId={"78ahd8o7awdhwa"}
        defaultCenter={{ lat: 40.7749, lng: -130.4194 }}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        onZoomChanged={(e) => setZoom(e.map.getZoom()!)}
      />
      <Heatmap
        data={data}
        radius={radius}
        opacity={app.state.opacity}
        type={app.state.heatmapType}
      />
      {data && (
        <div className="absolute left-0 top-0">
          <Controls />
        </div>
      )}
      <div className="absolute left-0 bottom-0">
        <DataLoader onData={setData} />
      </div>
    </React.Fragment>
  );
});

const DataLoader = React.memo(function DataLoader({
  onData,
}: {
  onData: (data: DistancesData) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChangeFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!inputRef.current) {
      return;
    }

    const file = e.currentTarget.files![0];

    let data = undefined;
    try {
      data = JSON.parse(await file.text()) as DistancesData;
    } catch (error) {
      console.error(error);
    }

    if (data && data.meta && data.meta.count > 0) {
      onData(data);
      return;
    }

    inputRef.current.value = "";
    console.error("Distance data provided was invalid!");
  };

  return (
    <input
      ref={inputRef}
      className="text-white bg-black bg-opacity-55 p-1"
      type="file"
      multiple={false}
      accept="application/json"
      onChange={handleChangeFile}
    />
  );
});

const Heatmap = React.memo(function Heatmap({
  data,
  radius,
  opacity,
  type,
}: {
  data: DistancesData | undefined;
  radius: number;
  opacity: number;
  type: HeatmapType;
}) {
  const map = useMap();
  const vis = useMapsLibrary("visualization");

  const heatmap = React.useMemo(() => {
    if (!vis) {
      return undefined;
    }

    return new google.maps.visualization.HeatmapLayer({
      radius,
      opacity,
    });
  }, [vis, radius, opacity]);

  React.useEffect(() => {
    if (!heatmap || !data) {
      return;
    }

    heatmap.setData(
      data.distances.reduce(
        (
          acc: Array<{ location: google.maps.LatLng; weight: number }>,
          current
        ) => {
          if (
            current.rows?.length > 0 &&
            current.rows[0].elements?.length > 0 &&
            current.rows[0].elements[0].status == "OK"
          ) {
            acc.push({
              location: new google.maps.LatLng(
                current.origin_coords[0],
                current.origin_coords[1]
              ),
              weight: current.rows[0].elements[0][type].value,
            });
          }
          return acc;
        },
        []
      )
    );
  }, [heatmap, data, radius, opacity, type]);

  React.useEffect(() => {
    if (!heatmap || !map) {
      return;
    }
    heatmap.setMap(map);
    return () => {
      heatmap.setMap(null);
    };
  }, [heatmap, map]);

  return <React.Fragment />;
});
