

import Usuario from "../models/usuario.js";

export const registrarUsuario = async ({ nombre, usuario, contrasenya, rol }) => {
  try {
    const nuevoUsuario = new Usuario({
      nombre,
      usuario,
      contrasenya,
      rol
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

  // Comparar directamente texto plano
  if (usuarioEncontrado.contrasenya !== contrasenya) {
    return { exito: false, mensaje: "Contraseña incorrecta" };
  }

  // Si coincide
  return { exito: true, usuario: usuarioEncontrado };
};
