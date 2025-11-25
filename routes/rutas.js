import { Router } from "express";
import { crearCategoria, mostrarCategoria, eliminarCategoria, actualizarCategoria, obtenerCategoriaPorId } from "../bd/CategoriaBd.js";
import { crearArticulo, subirArchivo as subirArchivoArticulo, mostrarArticulos, eliminarArticulo, mostrarArticuloPorId, editarArticulo } from "../bd/ArticulosBD.js";
import { registrarUsuario, verificarUsuario, obtenerUsuarioPorId, editarUsuario, eliminarUsuario, obtenerTodosLosUsuarios, cambiarEstadoUsuario, cambiarRolUsuario } from "../bd/usuarioBD.js";
import { subirArchivo as subirFotoPerfil } from "../middlewares/subirArchivos.js";
// NUEVA IMPORTACIÓN
import { compartirArticulo, verCompartidosConmigo, verCompartidosPorMi } from "../bd/compartirBD.js";

const router = Router();

// Configuración de multer
const uploadArticulo = subirArchivoArticulo(); 
const uploadPerfil = subirFotoPerfil();       

function requireLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/"); 
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.usuario && req.session.rol === "admin") {
    return next();
  }
  res.status(403).send("Acceso denegado: Solo administradores");
}

// USUARIO ****************************************************************

router.get("/", (req,res)=>{
    res.render("login.ejs", {titulo: "Login"})
})

router.get("/cerrarSesion",(req,res)=>{
    req.session.destroy()
    res.clearCookie(process.env.NOMBRE_COOKIE || "session_usuario", { path: "/" })
    res.redirect("/")
})

router.post("/login", async (req, res) => {
  const { usuario, contrasenya } = req.body;
  const resultado = await verificarUsuario({ usuario, contrasenya });

  if (resultado.exito) {
    req.session.usuario = resultado.usuario._id;
    req.session.nombre = resultado.usuario.nombre;
    req.session.rol = resultado.usuario.rol;
    
    // Si es admin, redirigir a panel admin, si no a inicio normal (opcional, aqui va a inicio todos)
    res.redirect("/inicio");
  } else {
    res.render("login.ejs", {
      titulo: "Login",
      error: resultado.mensaje
    });
  }
});

router.get("/registarUsuario", (req,res)=>{
    res.render("registraUsuario.ejs", {titulo: "Registro de Usuario"})
})

router.post("/registarUsuario", uploadPerfil, async (req, res) => {
    const datos = req.body;
    if (req.file) {
        datos.foto = req.file.filename;
    }
    // rol y suspendido se ponen por defecto en el modelo
    const respuesta = await registrarUsuario(datos);
    console.log(respuesta);
    res.redirect("/");
});

router.get("/perfil", requireLogin, async (req, res) => {
    const usuario = await obtenerUsuarioPorId(req.session.usuario);
    res.render("perfil.ejs", { titulo: "Mi Perfil", usuario });
});

router.post("/editarPerfil", requireLogin, uploadPerfil, async (req, res) => {
    const { id, nombre, usuario, contrasenya } = req.body;
    const nuevaFoto = req.file ? req.file.filename : null;
    
    await editarUsuario(id, { nombre, usuario, contrasenya }, nuevaFoto);
    req.session.nombre = nombre;
    res.redirect("/perfil");
});

router.get("/borrarMiCuenta", requireLogin, async (req, res) => {
    const id = req.session.usuario;
    await eliminarUsuario(id);
    req.session.destroy();
    res.clearCookie(process.env.NOMBRE_COOKIE || "session_usuario", { path: "/" });
    res.redirect("/");
});

// NUEVAS RUTAS DE ADMINISTRADOR *****************************************

router.get("/admin/usuarios", requireAdmin, async (req, res) => {
    const usuarios = await obtenerTodosLosUsuarios();
    res.render("adminUsuarios.ejs", { titulo: "Admin Usuarios", usuarios });
});

router.get("/admin/hacerAdmin/:id", requireAdmin, async (req, res) => {
    await cambiarRolUsuario(req.params.id, "admin");
    res.redirect("/admin/usuarios");
});

router.get("/admin/hacerUsuario/:id", requireAdmin, async (req, res) => {
    await cambiarRolUsuario(req.params.id, "usuario");
    res.redirect("/admin/usuarios");
});

router.get("/admin/suspender/:id", requireAdmin, async (req, res) => {
    await cambiarEstadoUsuario(req.params.id, true);
    res.redirect("/admin/usuarios");
});

router.get("/admin/activar/:id", requireAdmin, async (req, res) => {
    await cambiarEstadoUsuario(req.params.id, false);
    res.redirect("/admin/usuarios");
});

// NUEVAS RUTAS DE COMPARTIR ********************************************

router.get("/compartir/:idArticulo", requireLogin, async (req, res) => {
    const usuarios = await obtenerTodosLosUsuarios();
    // Filtramos para que no aparezca el mismo usuario en la lista
    const otrosUsuarios = usuarios.filter(u => u._id.toString() !== req.session.usuario);
    
    res.render("formCompartir.ejs", { 
        titulo: "Compartir", 
        usuarios: otrosUsuarios,
        idArticulo: req.params.idArticulo 
    });
});

router.post("/procesarCompartir", requireLogin, async (req, res) => {
    const { idArticulo, idReceptor } = req.body;
    await compartirArticulo({
        emisor: req.session.usuario,
        receptor: idReceptor,
        articulo: idArticulo
    });
    res.redirect("/misCompartidos");
});

router.get("/misCompartidos", requireLogin, async (req, res) => {
    const recibidos = await verCompartidosConmigo(req.session.usuario);
    const enviados = await verCompartidosPorMi(req.session.usuario);
    
    res.render("misCompartidos.ejs", { 
        titulo: "Compartidos", 
        recibidos, 
        enviados 
    });
});


// CATEGORIA ROUTES ***************************************************************

router.get("/categoria", requireAdmin,(req,res)=>{
    res.render("crearCategoria.ejs", {titulo: "categoria"})
})

router.post("/categories/add", requireAdmin, async (req,res)=>{
    const respuestaMongo= await crearCategoria(req.body)
    console.log(respuestaMongo)
    res.redirect("/mostarCategoria")
})

router.get("/mostarCategoria", requireAdmin, async (req,res)=>{ // Protegido para admin según lógica
    const categoriasBD = await mostrarCategoria()
    res.render("mostarCategoria.ejs", {categoriasBD})
})

router.get("/borrarCategoria/:id", requireAdmin, async (req,res)=>{
    const {id} = req.params
    const respuestaMongo = await eliminarCategoria(id)
    console.log(respuestaMongo)
    res.redirect("/mostarCategoria")
})

router.get("/editarCategoria/:id", requireAdmin, async (req,res)=>{
    try {
        const id = req.params.id;
        const categoria = await obtenerCategoriaPorId(id);
        res.render("editarCategoria.ejs", { categoria });
    } catch (error) {
        console.error("Error getting category:", error);
        res.redirect("/mostarCategoria");
    }
});

router.post("/editarCategoria", requireAdmin, async (req, res) => {
    try {
        const { id, nombre, descripcion } = req.body;
        await actualizarCategoria(id, { nombre, descripcion });
        res.redirect("/mostarCategoria");
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).send("Error al actualizar la categoría");
    }
});

// ARTICULOS ROUTES ***************************************************************

router.get("/inicio", requireLogin, async (req, res) => {
    try {
        const [articulos, categorias] = await Promise.all([
            mostrarArticulos(),
            mostrarCategoria()
        ]);
        const validArticulos = articulos.filter(art => art.categoria && art.categoria._id);
        res.render("inicio.ejs", { 
            articulos: validArticulos,
            categorias: categorias
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.render("inicio.ejs", { articulos: [], categorias: [] });
    }
})

router.get("/crearArticulos", requireLogin, async (req,res)=>{
    const categoriasBD = await mostrarCategoria()
    res.render("crearArticulos.ejs", {
        titulo: "Crear Articulos",
        categorias: categoriasBD
    })
})

router.post("/crear", requireLogin, uploadArticulo, async(req,res)=>{
    const datos = req.body;
    datos.imagen = req.file ? req.file.filename : null;
    const articulosBd= await crearArticulo(datos)
    console.log(articulosBd)
    res.redirect("/inicio")
})

router.get("/eliminarArticulo/:id", requireLogin, async (req,res)=>{
    const {id} = req.params
    const respuestaMongo = await eliminarArticulo(id)
    console.log(respuestaMongo)
    res.redirect("/inicio")
})

router.get("/editar/:id", requireLogin, async (req,res)=>{
    const {id} = req.params;
    const articulo = await mostrarArticuloPorId(id);
    const categoriasBD = await mostrarCategoria();
    res.render("editarArticulo.ejs", {
        titulo: "Editar Artículo",
        articulo: articulo,
        categorias: categoriasBD
    });
})

router.post("/editarArticulo", requireLogin, async (req,res) => {
    const { id, nombre, categoria, calificacion } = req.body;
    await editarArticulo(id, { nombre, categoria, calificacion });
    res.redirect("/inicio");
});

export default router