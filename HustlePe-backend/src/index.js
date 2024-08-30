import app from './app.js' ;
import { configDotenv } from 'dotenv';
import connectDB from './db/database.db.js';

configDotenv();
const port = process.env.PORT || 5000 ;

connectDB() ;

app.listen(port , () => {
    console.log(`Server is running on port ${port}`) ;
})