import mongoose from "mongoose";

const articulosSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categoria",   
        required: true
    },
    calificacion: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    imagen: {
        type: String,
        required: false
    },
    // ---> NUEVO: Relación con el Usuario (Dueño)
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    }
});

export default mongoose.model("Articulos", articulosSchema);