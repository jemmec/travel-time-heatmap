const fs = require("fs");
const path = require("path");
require("dotenv").config();

const EARTH_RAD = 6378137;

// Point generation
const destination = [-34.92864428718256, 138.6000002200029];
const density = 250;
const radius = 1_000;

// Travel settings
const arrivalTime = Date.UTC(2024, 3, 3, 9, 0, 0) / 1000;

/**
 *
 * @param {[number,number]} coordinate
 * @returns
 */
function escapeCoord(coordinate) {
  return encodeURIComponent(coordinate.join(","));
}

function calculateZoomLevel(radius, buffer) {
  const adjustedRadius = radius * (1 + buffer / 100);
  const zoom = Math.log2((2 * Math.PI * EARTH_RAD) / (256 * adjustedRadius));
  return Math.floor(zoom);
}

/**
 *
 * @param {*} destination
 * @param {*} origin
 * @returns {null | Array<any>}
 */
async function fetchDistanceInfo(destination, origin) {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${escapeCoord(
    destination
  )}&origins=${escapeCoord(
    origin
  )}&arrival_time=${arrivalTime}&units=metric&key=${
    process.env.NEXT_PUBLIC_API_KEY
  }`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  if (data?.status != "OK") {
    return null;
  }
  return data;
}

/**
 * Offsets the original coordinate by offset params in meters
 *
 * @param {[number,number]} original
 * @param {number} latOffset
 * @param {number} lonOffset
 * @returns {[number,number]} the offset coordinate
 */
function offsetCoordinateByMeters(original, latOffset, lonOffset) {
  const rads = [
    latOffset / EARTH_RAD,
    lonOffset / (EARTH_RAD * Math.cos((Math.PI * original[0]) / 180)),
  ];
  return [
    original[0] + (rads[0] * 180) / Math.PI,
    original[1] + (rads[1] * 180) / Math.PI,
  ];
}

/**
 * Fills data with an array of coordinates given the settings
 *
 * @return {Array<[number,number]>} Coordinate points
 */
function generatePoints() {
  const ret = [];
  let lat = radius / 2;
  let lon = lat;
  const count = radius / density;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      ret.push(offsetCoordinateByMeters(destination, lat, lon));
      lon -= density;
    }
    lat -= density;
  }
  return ret;
}

/**
 * Takes an array of coordinates and calculates the distance information
 *
 * @param {Array<[number,number]>} points
 */
async function calculateDistances(points) {
  const ret = [];
  for (let i = 0; i < points.length; i++) {
    const res = await fetchDistanceInfo(destination, points[i]);
    if (res === null) {
      continue;
    }
    ret.push({
      destination_coords: destination,
      origin_coords: points[i],
      ...res,
    });
  }
  return ret;
}

/**
 *
 * @param {Array<any>} distances
 */
function writeFile(distances) {
  const filePath = path.join(process.cwd(), "distances");
  let unique = `${filePath}.json`;
  let count = 0;
  while (fs.existsSync(unique)) {
    unique = `${filePath}_${count++}.json`;
  }

  let jsonObj = {
    meta: {
      destination,
      density,
      radius,
      arrivalTime,
      zoom: calculateZoomLevel(radius, 20),
      count: distances.length,
    },
    distances,
  };

  fs.writeFileSync(unique, JSON.stringify(jsonObj, null, 2), "utf-8");
}

(async () => {
  // Generate the coordinate points
  const points = generatePoints();
  // Calculate the travel distances
  const distances = await calculateDistances(points);
  // Write the distances to an output file
  writeFile(distances);
})();
