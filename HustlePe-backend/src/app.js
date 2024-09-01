import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { configDotenv } from 'dotenv';

configDotenv();

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN ,
}));

app.use(express.json({limit: "50kb"})) ;
app.use(express.urlencoded({extended: true , limit: "16kb"})) ;
app.use(express.static("public")) ;
app.use(cookieParser()) ;


import hustlerRouter from './routes/auth.routes.js' ;
app.use('/api/v1/hustler', hustlerRouter) ;

export default app ;