import catchAsync from '../helper/catchAsync.js';

export const getTourDestination = catchAsync(async (req, res, next) => {
  const lat = req.lat;
  const lng = req.lng;
  const apikey = process.env.GEOAPIFY_API;

  const [destination, hotel] = await Promise.all([
    fetch(
      `https://api.geoapify.com/v2/places?categories=tourism.attraction&filter=circle:${lng},${lat},10000&limit=10&apiKey=${apikey}`,
    ),

    fetch(
      `https://api.geoapify.com/v2/places?categories=accommodation.hotel&filter=circle:${lng},${lat},10000&limit=10&apiKey=${apikey}`,
    ),
  ]);

  const [dataDestination, dataHotel] = await Promise.all([
    destination.json(),
    hotel.json(),
  ]);

  const data = {
    destinations: dataDestination.features,
    hotels: dataHotel.features,
  };

  res.status(200).json({
    status: 'sucsess',
    resultDestination: data.hotels.length,
    resultHotels: data.destinations.length,
    data,
  });
});
