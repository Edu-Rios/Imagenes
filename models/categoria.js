

// atributos de tubase de datos 
import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim:true},

    descripcion: {
        type: String,
        required: true,
        trim:true}
})

export default mongoose.model("Categoria", categoriaSchema);