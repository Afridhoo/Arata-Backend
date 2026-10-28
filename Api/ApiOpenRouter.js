import catchAsync from "../helper/catchAsync.js";

export const ApiCallOpenRouter = async (coords, step) => {
  const apiCall = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: {
        Authorization: process.env.OPENROUTER_APIKEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: coords,
        instructions: step,
      }),
    },
  );
  const result = await apiCall.json();

  return result;
};



export const getLineRoad = catchAsync(async (req, res, next) => {
  const { coordinates, coordsBus, idLocations } = req.body;

  const [lineLoc, lineBus] = await Promise.allSettled([
    coordinates && ApiCallOpenRouter(coordinates, false),
    coordsBus && ApiCallOpenRouter(coordsBus, true),
  ]);

  const handleFlipCoords = (val, getSegment) => {
    const line = val.features?.[0].geometry.coordinates.map(([lng, lat]) => [
      lat,
      lng,
    ]);
    const segment = getSegment && val.features?.[0].properties.segments?.[0];
    return { line, segment };
  };

  const coordinatesListLoc =
    lineLoc.status === 'fulfilled' &&
    lineLoc.value &&
    handleFlipCoords(lineLoc.value);

  const coordinatesBus =
    lineBus.status === 'fulfilled' &&
    lineBus.value &&
    handleFlipCoords(lineBus.value, true);

  res.status(200).json({
    status: 'sucsess',
    data: { coordinatesListLoc, coordinatesBus, idLocations },
  });
});
