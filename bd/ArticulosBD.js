import articulo  from "../models/articulos.js";
import multer  from "multer";

// Ahora recibimos el idUsuario
export async function crearArticulo({nombre, categoria, calificacion, imagen, usuario}){
    const nuevoArticulo = new articulo({
        nombre: nombre,
        categoria: categoria,
        calificacion: calificacion,
        imagen: imagen, // Corregido 'Imagen' a 'imagen' (minúscula) para coincidir con schema
        usuario: usuario // Guardamos el dueño
    })
    const respuestaMongo = await nuevoArticulo.save();
    return respuestaMongo;
}

// Modificado para recibir idUsuario y filtrar
export async function mostrarArticulos(idUsuario){
    // Busca solo los artículos donde el campo 'usuario' coincida con el idUsuario
    const articulosBD = await articulo.find({ usuario: idUsuario }).populate("categoria").lean();
    return articulosBD;
}

export async function mostrarArticuloPorId(id){
    const articuloBD = await articulo.findById(id).populate("categoria").lean();
    return articuloBD;
}

export async function editarArticulo(id, datos) {
    const respuestaMongo = await articulo.findByIdAndUpdate(id, datos, { new: true });
    return respuestaMongo;
}

export async function eliminarArticulo(id){
    const articuloEliminado = await articulo.findByIdAndDelete(id);
    return articuloEliminado;
}

export function subirArchivo() {
    const storage = multer.diskStorage({
        destination:"./web/images",
        filename: function(req, file, cb) { 
        const archivo = file.originalname
        cb(null, Date.now()  + archivo)  
        }
    })
    const upload = multer({storage}).single("foto")
    return upload                                                   
}