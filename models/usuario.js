
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
    rol: {
    type: String,
    enum: ["admin", "usuario"],
    default: "usuario"
  }

});

export default mongoose.model("Usuario", usuarioSchema);