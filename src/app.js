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
 
export default app ;