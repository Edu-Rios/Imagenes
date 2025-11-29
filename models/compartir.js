import mongoose from 'mongoose';

const compartirSchema = new mongoose.Schema({
    emisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario", // Debe coincidir con mongoose.model("Usuario", ...)
        required: true
    },
    receptor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    articulo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Articulos", // Debe coincidir con mongoose.model("Articulos", ...)
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Compartir", compartirSchema);