import app from './app.js' ;
import { configDotenv } from 'dotenv';
import connectDB from './db/database.db.js';

configDotenv();
// dotenv.config({ path: './.env' });
const port = process.env.PORT || 5000 ;

connectDB() ;

app.get('/', (req, res) => {
    res.send('Hello World!') ;
})

app.listen(port , () => {
    console.log(`Server is running on port ${port}`) ;
})