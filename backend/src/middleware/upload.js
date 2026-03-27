const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define storage location and custom filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // We already created backend/uploads folder and mapped to /app/uploads
    cb(null, path.join(__dirname, '../../uploads')); 
  },
  filename: (req, file, cb) => {
    // Generate unique identifier to prevent overwrites
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// Configure filter for sensible limits (exclude executables/scripts)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.vbs', '.js', '.php', '.py', '.cjs', '.mjs'];
  
  if (dangerousExts.includes(ext)) {
    return cb(new Error('Tipo de archivo no permitido por seguridad'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter
});

module.exports = upload;
