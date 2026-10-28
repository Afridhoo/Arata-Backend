import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';

export const getLocationSearch = catchAsync(async (req, res, next) => {
  const { search } = req.params;

  const resApi = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&polygon_geojson=1`,
    {
      headers: {
        'User-Agent': 'MyApp/1.0',
      },
    },
  );

  const data = await resApi.json();
  if (data.length === 0) return next(new errorApp('Not Found Search', 400));

  res.status(200).json({
    status: 'sucsess',
    result: data.length,
    data,
  });
});


export const getLocationLatlng = catchAsync(async (req, res, next) => {
  const lat = req.lat;
  const lng = req.lng;

  const resApi = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&polygon_geojson=1`,
    {
      headers: {
        'User-Agent': 'MyApp/1.0',
      },
    },
  );

  const data = await resApi.json();

  res.status(200).json({
    data,
  });
});

