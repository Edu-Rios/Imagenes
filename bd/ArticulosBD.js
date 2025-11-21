import articulo  from "../models/articulos.js";
import multer  from "multer";


export async function crearArticulo({nombre, categoria, calificacion, imagen}){
    const nuevoArticulo = new articulo({
        nombre: nombre,
        categoria: categoria,
        calificacion: calificacion,
        Imagen: imagen
    })
    const respuestaMongo = await nuevoArticulo.save();
    return respuestaMongo;
}

export async function mostrarArticulos(){
    const articulosBD = await articulo.find().populate("categoria").lean();
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
        filename: function(req, file, cb) { //cb: callback para recibir funcion como parametro, a donde vuelve
        const archivo = file.originalname
        cb(null, Date.now()  + archivo)  // date.now(): para que no se repitan los nombres, se les agregga la fecha y el milisegundo 
        
        }
    })
    const upload = multer({storage}). single ("foto")           //single("archivo") el single es para subir un solo archivo, el nombre del input
    return upload                                                   //array("fotos", 2) para subir varios archivos, el nombre del input y la cantidad maxima de archivos
}                                                                         