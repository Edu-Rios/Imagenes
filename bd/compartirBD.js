import Compartir from "../models/compartir.js";

export async function compartirArticulo(datos) {
    const nuevoCompartido = new Compartir(datos);
    return await nuevoCompartido.save();
}

export async function verCompartidosConmigo(idUsuario) {
    return await Compartir.find({ receptor: idUsuario })
        .populate('emisor', 'usuario nombre') 
        .populate('articulo') 
        .lean();
}

export async function verCompartidosPorMi(idUsuario) {
    return await Compartir.find({ emisor: idUsuario })
        .populate('receptor', 'usuario nombre') 
        .populate('articulo')
        .lean();
}