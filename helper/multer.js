import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadManyImage = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'imagesDestination', maxCount: 5 },
  { name: 'imagesHotel', maxCount: 5 },
]);

export const uploadImageUser = upload.single('photo');

export const uploadImageDocumentation = upload.fields([
  { name: 'imageDocumentation', maxCount: 5 },
]);
