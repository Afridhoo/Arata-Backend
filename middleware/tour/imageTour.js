import catchAsync from "../../helper/catchAsync.js";
import { streamUpload } from "../../helper/cloudinary.js";

export const convertImage = catchAsync(async (req, res, next) => {
  const files = req.files;

  const locations = JSON.parse(req.body.locations);
  const startLocation = JSON.parse(req.body.startLocation);

  const handlePromise = async (value) =>
    files?.[value] &&
    (await Promise.all(files?.[value]?.map((el) => streamUpload(el.buffer))));

  const [imageCover, imagesHotel, imagesDestination] = await Promise.all([
    handlePromise('imageCover'),
    handlePromise('imagesHotel'),
    handlePromise('imagesDestination'),
  ]);

  const getSecureUrl = (value) => value?.map((el) => el.secure_url);

  if (files) {
    if (files.imageCover) req.body.imageCover = imageCover[0].secure_url;

    const urlImgHotel = getSecureUrl(imagesHotel);
    const urlImgDestination = getSecureUrl(imagesDestination);

    const formatHelper = (fields, imgUrl) =>
      locations?.[fields]?.map((el, idx) => ({
        ...el,
        image: imgUrl[idx],
      }));

    const formatLocation = {
      destination: formatHelper('destination', urlImgDestination),
      hotel: formatHelper('hotel', urlImgHotel),
    };

    req.body.locations = formatLocation;
    req.body.startLocation = startLocation;
  }

  next();
});


export const convertImgUpdate = catchAsync(async (req, res, next) => {
  const files = req.files;

  const locationsUpdate = req.body.locationUpdate;
  const soldOut = req.body.soldOut;

  if (soldOut) req.body.soldOut = JSON.parse(soldOut);

  const handlePromise = async (value) =>
    files?.[value] &&
    (await Promise.all(files?.[value]?.map((el) => streamUpload(el.buffer))));

  if (files) {
    const [imgCover, imgsHotel, imgsDest] = await Promise.all([
      handlePromise('imageCover'),
      handlePromise('imagesHotel'),
      handlePromise('imagesDestination'),
    ]);

    const getSecureUrl = (value) => value?.map((el) => el.secure_url);

    if (locationsUpdate) {
      const { destination, hotel } = JSON.parse(locationsUpdate);

      function formatUpdateLoc(value, img) {
        let idx = 0;

        return value?.map((el) => ({
          ...el,
          image: !el.image && img ? getSecureUrl(img)[idx++] : el.image,
        }));
      }

      const formatLocations = {
        destination: formatUpdateLoc(destination, imgsDest),
        hotel: formatUpdateLoc(hotel, imgsHotel),
      };

      req.body.locations = formatLocations;
    }
    if (files.imageCover) req.body.imageCover = imgCover[0].secure_url;
  }

  next();
});