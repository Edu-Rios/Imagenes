import { Router } from "express";
import { crearCategoria, mostrarCategoria, eliminarCategoria, actualizarCategoria, obtenerCategoriaPorId } from "../bd/CategoriaBd.js";
import { crearArticulo, subirArchivo as subirArchivoArticulo, mostrarArticulos, eliminarArticulo, mostrarArticuloPorId, editarArticulo } from "../bd/ArticulosBD.js";
import { registrarUsuario, verificarUsuario, obtenerUsuarioPorId, editarUsuario, eliminarUsuario } from "../bd/usuarioBD.js";
import { subirArchivo as subirFotoPerfil } from "../middlewares/subirArchivos.js";

const router = Router();

// Configuración de multer
const uploadArticulo = subirArchivoArticulo(); // Para artículos (existente)
const uploadPerfil = subirFotoPerfil();        // Para perfil (nuevo)

function requireLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/"); 
  }
  next();
}

// Solo usuario normal
function requireUser(req, res, next) {
  if (req.session.usuario && req.session.usuario.rol === "usuario") {
    return next();
  }
  res.status(403).send("Acceso denegado: Solo usuarios normales");
}

// Solo administrador
function requireAdmin(req, res, next) {
  if (req.session.usuario && req.session.usuario.rol === "admin") {
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
    res.render("login.ejs", {
      titulo: "Login",
      error: resultado.mensaje
    });
  }
});

router.get("/registarUsuario", (req,res)=>{
    res.render("registraUsuario.ejs", {titulo: "Registro de Usuario"})
})

// MODIFICADO: Usar middleware uploadPerfil y guardar foto
router.post("/registarUsuario", uploadPerfil, async (req, res) => {
    const datos = req.body;
    // Si se subió foto, guardar el nombre del archivo
    if (req.file) {
        datos.foto = req.file.filename;
    }
    const respuesta = await registrarUsuario(datos);
    console.log(respuesta);
    res.redirect("/");
});

//Ver Perfil
router.get("/perfil", requireLogin, async (req, res) => {
    const usuario = await obtenerUsuarioPorId(req.session.usuario);
    res.render("perfil.ejs", { titulo: "Mi Perfil", usuario });
});

//Editar Perfil
router.post("/editarPerfil", requireLogin, uploadPerfil, async (req, res) => {
    const { id, nombre, usuario, contrasenya } = req.body;
    const nuevaFoto = req.file ? req.file.filename : null;
    
    await editarUsuario(id, { nombre, usuario, contrasenya }, nuevaFoto);
    
    // Actualizar nombre en sesión por si cambio
    req.session.nombre = nombre;
    
    res.redirect("/perfil");
});

// Borrar Cuenta
router.get("/borrarMiCuenta", requireLogin, async (req, res) => {
    const id = req.session.usuario;
    await eliminarUsuario(id);
    
    req.session.destroy();
    res.clearCookie(process.env.NOMBRE_COOKIE || "session_usuario", { path: "/" });
    res.redirect("/");
});


// CATEGORIA ROUTES ***************************************************************

router.get("/categoria", requireAdmin,(req,res)=>{
    res.render("crearCategoria.ejs", {titulo: "categoria"})
})

router.post("/categories/add", async (req,res)=>{
    const respuestaMongo= await crearCategoria(req.body)
    console.log(respuestaMongo)
    res.redirect("/mostarCategoria")
})

router.get("/mostarCategoria", async (req,res)=>{
    const categoriasBD = await mostrarCategoria()
    res.render("mostarCategoria.ejs", {categoriasBD})
})

router.get("/borrarCategoria/:id", async (req,res)=>{
    const {id} = req.params
    const respuestaMongo = await eliminarCategoria(id)
    console.log(respuestaMongo)
    res.redirect("/mostarCategoria")
})

router.get("/editarCategoria/:id", async (req,res)=>{
    try {
        const id = req.params.id;
        const categoria = await obtenerCategoriaPorId(id);
        res.render("editarCategoria.ejs", { categoria });
    } catch (error) {
        console.error("Error getting category:", error);
        res.redirect("/mostarCategoria");
    }
});

router.post("/editarCategoria", async (req, res) => {
    try {
        const { id, nombre, descripcion } = req.body;
        const respuestaMongo = await actualizarCategoria(id, {
            nombre,
            descripcion
        });
        res.redirect("/mostarCategoria");
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).send("Error al actualizar la categoría");
    }
});

// ARTICULOS ROUTES ***************************************************************

router.get("/inicio", requireLogin,async (req, res) => {
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
        res.render("inicio.ejs", { 
            articulos: [],
            categorias: []
        });
    }
})

router.get("/crearArticulos", requireLogin,async (req,res)=>{
    const categoriasBD = await mostrarCategoria()
    res.render("crearArticulos.ejs", {
        titulo: "Crear Articulos",
        categorias: categoriasBD
    })
})

router.post("/crear", uploadArticulo, async(req,res)=>{ // Usamos uploadArticulo aquí
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

router.get("/editar/:id", async (req,res)=>{
    const {id} = req.params;
    const articulo = await mostrarArticuloPorId(id);
    const categoriasBD = await mostrarCategoria();
    res.render("editarArticulo.ejs", {
        titulo: "Editar Artículo",
        articulo: articulo,
        categorias: categoriasBD
    });
})

router.post("/editarArticulo", async (req,res) => {
    const { id, nombre, categoria, calificacion } = req.body;
    const respuestaMongo = await editarArticulo(id, {
        nombre,
        categoria,
        calificacion
    });
    res.redirect("/inicio");
});

export default router