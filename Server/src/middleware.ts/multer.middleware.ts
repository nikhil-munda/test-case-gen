import multer from "multer";
import path from "path";
const storage = multer.diskStorage({
  // Set the destination folder for uploads
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  // Set the filename for the uploaded file
  filename: function (req, file, cb) {
    // Use the original name + timestamp to make it unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const allowedMimeTypes = ["image/jpeg", "image/png"];

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images, videos, and PDFs are allowed!"));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter,
});
