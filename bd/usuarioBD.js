import Usuario from "../models/usuario.js";
import fs from "fs";
import path from "path";

function borrarFotoFisica(nombreFoto) {
    if (nombreFoto) {
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

  // VALIDACIÓN DE SUSPENSIÓN (Punto 9)
  if (usuarioEncontrado.suspendido) {
      return { exito: false, mensaje: "Cuenta suspendida. Contacte al administrador." };
  }

  if (usuarioEncontrado.contrasenya !== contrasenya) {
    return { exito: false, mensaje: "Contraseña incorrecta" };
  }

  return { exito: true, usuario: usuarioEncontrado };
};

export const obtenerUsuarioPorId = async (id) => {
    return await Usuario.findById(id).lean();
};

export const editarUsuario = async (id, datos, nuevaFoto) => {
    const usuarioAntiguo = await Usuario.findById(id);
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
    return await Usuario.findByIdAndUpdate(id, datosActualizar, { new: true });
};

export const eliminarUsuario = async (id) => {
    const usuario = await Usuario.findById(id);
    if (usuario && usuario.foto) {
        borrarFotoFisica(usuario.foto);
    }
    return await Usuario.findByIdAndDelete(id);
};



export const obtenerTodosLosUsuarios = async () => {
    return await Usuario.find().lean();
}

export const cambiarEstadoUsuario = async (id, estado) => {

    return await Usuario.findByIdAndUpdate(id, { suspendido: estado });
}

export const cambiarRolUsuario = async (id, rol) => {
    return await Usuario.findByIdAndUpdate(id, { rol: rol });
}