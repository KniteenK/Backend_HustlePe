import cookieParser from 'cookie-parser';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import express from 'express';

configDotenv() ;

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN ,
    credentials: true
}));

app.use(express.json({limit: "50kb"})) ;
app.use(express.urlencoded({extended: true , limit: "16kb"})) ;
app.use(express.static("public")) ;
app.use(cookieParser()) ;


import hustlerRouter from './routes/hustlerAuth.routes.js';
app.use('/api/v1/hustler', hustlerRouter) ;

import clientRouter from './routes/clientAuth.routes.js';
app.use('/api/v1/client', clientRouter) ;
 
import organizationRouter from './routes/organization.routes.js';
app.use('/api/v1/organization', organizationRouter);

export default app;

// --- Move the following to your main entry file (e.g., src/index.js) ---
// import http from 'http';
// import { Server } from "socket.io";
// import app from './app.js';

// const server = http.createServer(app);
// const io = new Server(server, { /* options */ });

// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);
//   socket.on("disconnect", () => {
//     console.log("A user disconnected:", socket.id);
//   });
// });

// server.listen(process.env.PORT || 3000, () => {
//   console.log("Server running...");
// });