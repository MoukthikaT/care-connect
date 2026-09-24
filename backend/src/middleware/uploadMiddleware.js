import multer from 'multer';

// Store files in memory buffer for immediate streaming to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Unsupported file format. Please upload JPEG, PNG, WEBP, GIF, or PDF documents.');
    error.statusCode = 400;
    cb(error, false);
  }
};

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
}).single('file');

export const uploadSinglePhoto = (fieldName = 'photo') => multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).single(fieldName);

export const uploadArray = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).array('files', 5);
