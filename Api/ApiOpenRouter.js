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
