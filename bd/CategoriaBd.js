import categoria from "../models/categoria.js";
import articulo from "../models/articulos.js";

export async function crearCategoria({nombre, descripcion}) {
    const nuevaCategoria = new categoria({
        nombre: nombre, 
        descripcion: descripcion
    });
    const respuestaMongo = await nuevaCategoria.save();
    return respuestaMongo;
}

export async function mostrarCategoria(){
    const categoriasBD = await categoria.find().lean();
    return categoriasBD;
}

export async function eliminarCategoria(id){
        await articulo.deleteMany({ categoria: id });
        const respuestaMongo = await categoria.findByIdAndDelete(id);
        if (!respuestaMongo) {
            throw new Error('Categoría no encontrada');
        }
        return respuestaMongo;
  
}

export async function obtenerCategoriaPorId(id){
    const categoriaBD = await categoria.findById(id).lean();
    return categoriaBD;
}

export async function actualizarCategoria(id, datos) {
    if (!datos || !datos.nombre || !datos.descripcion) {
        throw new Error('Datos de actualización incompletos');
    }
    
    const respuestaMongo = await categoria.findByIdAndUpdate(id, {
        nombre: datos.nombre.toString(),
        descripcion: datos.descripcion.toString()
    }, { new: true });
    
    return respuestaMongo;
}