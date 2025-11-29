import { Router } from "express";
import { crearCategoria, mostrarCategoria, eliminarCategoria, actualizarCategoria, obtenerCategoriaPorId } from "../bd/CategoriaBd.js";
import { crearArticulo, subirArchivo as subirArchivoArticulo, mostrarArticulos, eliminarArticulo, mostrarArticuloPorId, editarArticulo } from "../bd/ArticulosBD.js";
import { registrarUsuario, verificarUsuario, obtenerUsuarioPorId, editarUsuario, eliminarUsuario, obtenerTodosLosUsuarios, cambiarEstadoUsuario, cambiarRolUsuario } from "../bd/usuarioBD.js";
import { subirArchivo as subirFotoPerfil } from "../middlewares/subirArchivos.js";
import { compartirArticulo, verCompartidosConmigo, verCompartidosPorMi } from "../bd/compartirBD.js";

const router = Router();

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
    res.redirect("/inicio");
  } else {
    res.render("login.ejs", { titulo: "Login", error: resultado.mensaje });
  }
});

router.get("/registarUsuario", (req,res)=>{
    res.render("registraUsuario.ejs", {titulo: "Registro de Usuario"})
})

router.post("/registarUsuario", uploadPerfil, async (req, res) => {
    const datos = req.body;
    if (req.file) datos.foto = req.file.filename;
    await registrarUsuario(datos);
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
    await eliminarUsuario(req.session.usuario);
    req.session.destroy();
    res.redirect("/");
});

// ADMIN ROUTES **********************************************************

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

// COMPARTIR ROUTES ******************************************************

router.get("/compartir/:idArticulo", requireLogin, async (req, res) => {
    try {
        const usuarios = await obtenerTodosLosUsuarios();
        const otrosUsuarios = usuarios.filter(u => u._id.toString() !== req.session.usuario);
        
        res.render("formCompartir.ejs", { 
            titulo: "Compartir", 
            usuarios: otrosUsuarios,
            idArticulo: req.params.idArticulo 
        });
    } catch (error) {
        console.error("Error al cargar form compartir:", error);
        res.status(500).send("Error interno");
    }
});

router.post("/procesarCompartir", requireLogin, async (req, res) => {
    try {
        const { idArticulo, idReceptor } = req.body;
        if (!idReceptor) return res.send("Debes seleccionar un usuario");

        await compartirArticulo({
            emisor: req.session.usuario,
            receptor: idReceptor,
            articulo: idArticulo
        });
        res.redirect("/misCompartidos");
    } catch (error) {
        console.error("Error al compartir:", error);
        res.status(500).send("Error al compartir: " + error.message);
    }
});

router.get("/misCompartidos", requireLogin, async (req, res) => {
    try {
        const recibidos = await verCompartidosConmigo(req.session.usuario);
        const enviados = await verCompartidosPorMi(req.session.usuario);
        
        // CORRECCIÓN IMPORTANTE: Asegúrate de que el archivo se llame misCompartidos.ejs
        // Si tu archivo se llama "misCompartirdos.ejs", renómbralo o cambia esta línea.
        // Aquí asumo que usarás el nombre correcto "misCompartidos.ejs".
        res.render("misCompartidos.ejs", { 
            titulo: "Compartidos", 
            recibidos, 
            enviados 
        });
    } catch (error) {
        console.error("Error al ver compartidos:", error);
        res.status(500).send("Error al cargar compartidos");
    }
});

// CATEGORIA ROUTES *******************************************************

router.get("/categoria", requireAdmin, (req,res)=>{
    res.render("crearCategoria.ejs", {titulo: "categoria"})
})

router.post("/categories/add", requireAdmin, async (req,res)=>{
    await crearCategoria(req.body)
    res.redirect("/mostarCategoria")
})

router.get("/mostarCategoria", requireAdmin, async (req,res)=>{
    const categoriasBD = await mostrarCategoria()
    res.render("mostarCategoria.ejs", {categoriasBD})
})

router.get("/borrarCategoria/:id", requireAdmin, async (req,res)=>{
    await eliminarCategoria(req.params.id)
    res.redirect("/mostarCategoria")
})

router.get("/editarCategoria/:id", requireAdmin, async (req,res)=>{
    const categoria = await obtenerCategoriaPorId(req.params.id);
    res.render("editarCategoria.ejs", { categoria });
});

router.post("/editarCategoria", requireAdmin, async (req, res) => {
    const { id, nombre, descripcion } = req.body;
    await actualizarCategoria(id, { nombre, descripcion });
    res.redirect("/mostarCategoria");
});

// ARTICULOS ROUTES *******************************************************

router.get("/inicio", requireLogin, async (req, res) => {
    try {
        const [articulos, categorias] = await Promise.all([
            mostrarArticulos(req.session.usuario), // Pasamos el ID del usuario para filtrar
            mostrarCategoria()
        ]);
        
        const validArticulos = articulos.filter(art => art.categoria && art.categoria._id);
        res.render("inicio.ejs", { articulos: validArticulos, categorias: categorias });
    } catch (error) {
        console.error(error);
        res.render("inicio.ejs", { articulos: [], categorias: [] });
    }
})

router.get("/crearArticulos", requireLogin, async (req,res)=>{
    const categoriasBD = await mostrarCategoria()
    res.render("crearArticulos.ejs", { titulo: "Crear Articulos", categorias: categoriasBD })
})

router.post("/crear", requireLogin, uploadArticulo, async(req,res)=>{
    const datos = req.body;
    datos.imagen = req.file ? req.file.filename : null;
    datos.usuario = req.session.usuario; // Agregamos el dueño al crear
    
    await crearArticulo(datos)
    res.redirect("/inicio")
})

router.get("/eliminarArticulo/:id", requireLogin, async (req,res)=>{
    await eliminarArticulo(req.params.id)
    res.redirect("/inicio")
})

router.get("/editar/:id", requireLogin, async (req,res)=>{
    const articulo = await mostrarArticuloPorId(req.params.id);
    const categoriasBD = await mostrarCategoria();
    res.render("editarArticulo.ejs", { titulo: "Editar", articulo, categorias: categoriasBD });
})

router.post("/editarArticulo", requireLogin, async (req,res) => {
    const { id, nombre, categoria, calificacion } = req.body;
    await editarArticulo(id, { nombre, categoria, calificacion });
    res.redirect("/inicio");
});

export default router;