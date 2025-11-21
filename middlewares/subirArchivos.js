import multer from "multer";

export function subirArchivo() {
    const storage = multer.diskStorage({
        destination: "./web/images",
        filename: function(req, file, cb) {
            const archivo = file.originalname;
            cb(null, Date.now() + "-" + archivo);
        }
    });
    
    const upload = multer({ storage }).single("foto"); 
    return upload;
}