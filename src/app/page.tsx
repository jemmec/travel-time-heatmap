"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import React from "react";

type Coordinates = [number, number];

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
  readonly status: string;
};

type Row = {
  readonly elements: ReadonlyArray<Element>;
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

type LatLngLiteral = {
  lat: number;
  lng: number;
};

function toLatLongObj(inCoord: [number, number]): LatLngLiteral {
  return { lat: inCoord[0], lng: inCoord[1] };
}

export default function Index() {
  const apiKey: string | undefined = process.env.NEXT_PUBLIC_API_KEY;
  const [data, setData] = React.useState<DistancesData | undefined>(undefined);

  React.useEffect(() => {
    if (data == undefined) {
      return;
    }
    console.log("THEDATA:", data);
  }, [data]);

  if (apiKey == undefined) {
    console.warn("No google api key present");
    return <React.Fragment />;
  }

  return (
    <React.Fragment>
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={"123"}
          defaultCenter={{ lat: 40.7749, lng: -130.4194 }}
          defaultZoom={3}
          center={data ? toLatLongObj(data.meta.destination) : data}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
        />
      </APIProvider>
      <DataLoader onData={setData} />
    </React.Fragment>
  );
}

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
      className="absolute top-0 left-0 text-white bg-black bg-opacity-50"
      type="file"
      multiple={false}
      accept="application/json"
      onChange={handleChangeFile}
    />
  );
});
