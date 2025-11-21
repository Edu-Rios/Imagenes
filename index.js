import "dotenv/config"
import express from "express";
import rutas from "./routes/rutas.js";
import conectarBD from "./bd/bd.js";
import session from "express-session";

const app = express();

// Middleware
app.use(express.json()); // 👈 faltaban los paréntesis
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Configurar sesión
app.use(session({
  secret: process.env.SECRET_SESSION,
  resave: false,
  name:process.env.NOMBRE_COOKIE,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,  // cámbialo a true si Render usa HTTPS (normalmente sí)
    path:"/",
    maxAge: 1000 * 60 * 60
  }
}));

// Rutas
app.use("/", rutas);

// Iniciar servidor y conectar BD
const startServer = async () => {
  try {
    await conectarBD(); // Esperar conexión con MongoDB Atlas
    console.log("✅ Conexión establecida con MongoDB Atlas");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error al conectar con MongoDB o iniciar el servidor:", error.message);
    process.exit(1); // Detiene el proceso si falla la conexión
  }
};

startServer();
