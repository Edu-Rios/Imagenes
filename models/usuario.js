import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    usuario:{
        type: String,
        required: true,
        trim: true
    },
    contrasenya: {
        type: String,
        required: true,
        trim: true
    },
    foto: {
        type: String,
        default: null
    },
    // ROL: Por defecto todos son usuarios (Punto 2)
    rol: {
        type: String,
        enum: ["admin", "usuario"],
        default: "usuario" 
    },
    // SUSPENDIDO: Por defecto false (Punto 8)
    suspendido: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model("Usuario", usuarioSchema);