import cookieParser from 'cookie-parser';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import express from 'express';
import { Chat } from './models/chat.model.js';

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

// REST endpoint to get chat history between hustler and client
app.get('/api/v1/chat/history', async (req, res) => {
    const { hustlerId, clientId } = req.query;
    if (!hustlerId || !clientId) {
        return res.status(400).json({ error: "hustlerId and clientId are required" });
    }
    // Use the same roomId logic as in socket.js
    const roomId = [String(hustlerId), String(clientId)].sort().join("_");
    const history = await Chat.find({ roomId }).sort({ timestamp: 1 });
    res.status(200).json({ history });
});

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