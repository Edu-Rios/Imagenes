import Usuario from "../models/usuario.js";
import fs from "fs";
import path from "path";

// Función auxiliar para borrar la foto del servidor
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
      rol, // Si viene undefined, usará el default del modelo ("usuario")
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

  // ---> NUEVO: Verificación de suspensión (Punto 9)
  if (usuarioEncontrado.suspendido) {
      return { exito: false, mensaje: "Usuario suspendido. Contacte al administrador." };
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

// ---> NUEVAS FUNCIONES PARA ADMINISTRADOR (Puntos 3 y 8)
export const obtenerTodosLosUsuarios = async () => {
    return await Usuario.find().lean();
}

export const cambiarEstadoUsuario = async (id, nuevoEstadoSuspension) => {
    return await Usuario.findByIdAndUpdate(id, { suspendido: nuevoEstadoSuspension });
}

export const cambiarRolUsuario = async (id, nuevoRol) => {
    return await Usuario.findByIdAndUpdate(id, { rol: nuevoRol });
}