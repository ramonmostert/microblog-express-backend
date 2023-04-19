import multer from 'multer';
import { v1 } from 'uuid';

const MIME_TYPES: { [key: string]: string } = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './static/uploads/images');
  },
  filename: (req, file, cb) => {
    const ext = MIME_TYPES[file.mimetype];
    console.log(v1() + '.' + ext);
    cb(null, v1() + '.' + ext);
  },
});

const upload = multer({
  limits: { fileSize: 500000 },
  dest: '/uploads',
  storage,
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPES[file.mimetype];
    cb(null, isValid);
  },
});

export default upload;
