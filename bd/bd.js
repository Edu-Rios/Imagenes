

import mongoose from 'mongoose';
import 'dotenv/config';

async function conectarBD() {
    try {
        await mongoose.connect(process.env.SECRET_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    })
        console.log('Conectado a la base de datos:')
   
        }
    catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}

export default conectarBD;



