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
 
    rol: {
        type: String,
        enum: ["admin", "usuario"],
        default: "usuario" // Todos se registran como usuarios normales
    },
    suspendido: {
        type: Boolean,
        default: false // Por defecto la cuenta está activa
    }
});

export default mongoose.model("Usuario", usuarioSchema);