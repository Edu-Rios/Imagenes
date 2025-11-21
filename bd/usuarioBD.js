import Usuario from "../models/usuario.js";
import fs from "fs";
import path from "path";

// Función auxiliar para borrar la foto del servidor
function borrarFotoFisica(nombreFoto) {
    if (nombreFoto) {
        // Ruta donde se guardan las imagenes: web/images/
        // path.resolve() nos da la ruta raíz del proyecto
        const ruta = path.join(path.resolve(), "web", "images", nombreFoto);
        if (fs.existsSync(ruta)) {
            fs.unlinkSync(ruta);
        }
    }
}

export const registrarUsuario = async ({ nombre, usuario, contrasenya, rol, foto }) => {
  try {
    const nuevoUsuario = new Usuario({
      nombre,
      usuario,
      contrasenya,
      rol,
      foto 
    });

    const respuestaMongo = await nuevoUsuario.save();
    return respuestaMongo;
  } 
  catch (error) {
    console.error("Error al registrar usuario:", error);
    throw error;
  }
};

export const verificarUsuario = async ({ usuario, contrasenya }) => {
  const usuarioEncontrado = await Usuario.findOne({ usuario });
  if (!usuarioEncontrado) {
    return { exito: false, mensaje: "Usuario no encontrado" };
  }

  if (usuarioEncontrado.contrasenya !== contrasenya) {
    return { exito: false, mensaje: "Contraseña incorrecta" };
  }

  return { exito: true, usuario: usuarioEncontrado };
};

export const obtenerUsuarioPorId = async (id) => {
    const usuario = await Usuario.findById(id).lean();
    return usuario;
};

export const editarUsuario = async (id, datos, nuevaFoto) => {
    const usuarioAntiguo = await Usuario.findById(id);

    // Si se sube una foto nueva y el usuario ya tenía una, borrar la vieja
    if (nuevaFoto && usuarioAntiguo.foto) {
        borrarFotoFisica(usuarioAntiguo.foto);
    }
    
    const datosActualizar = { 
        nombre: datos.nombre,
        usuario: datos.usuario,
        contrasenya: datos.contrasenya
    };

    if (nuevaFoto) {
        datosActualizar.foto = nuevaFoto;
    }

    const respuestaMongo = await Usuario.findByIdAndUpdate(id, datosActualizar, { new: true });
    return respuestaMongo;
};

export const eliminarUsuario = async (id) => {
    const usuario = await Usuario.findById(id);
    
    if (usuario && usuario.foto) {
        borrarFotoFisica(usuario.foto);
    }

    const usuarioEliminado = await Usuario.findByIdAndDelete(id);
    return usuarioEliminado;
};