import { configDotenv } from 'dotenv';
import http from 'http';
import { Server } from "socket.io";
import app from './app.js';
import connectDB from './db/database.db.js';
import { initSocket } from './socket.js';

configDotenv();
// dotenv.config({ path: './.env' });
const port = process.env.PORT || 5000 ;

connectDB() ;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, { /* options */ });

initSocket(io);

app.get('/', (req, res) => {
    res.send('Hello World!') ;
})

server.listen(port , () => {
    console.log(`Server is running on port ${port}`) ;
})