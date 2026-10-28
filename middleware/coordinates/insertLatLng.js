export const insertLatlng = (model) => (req, res, next) => {
  const getLatLng = req.params[model].split(',');

  req.lat = Number(getLatLng[1]);
  req.lng = Number(getLatLng[0]);

  next();
};