import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Hustler } from "../models/hustler.model.js";
import { client } from "../models/client.model.js";



export const verifyJWT = asyncHandler( async (req, _ , next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") ;
        if (!token) {
            throw new apiError("Unauthorized request");
        }
    
        const isAuthorized = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) ;
    
        const user = await Hustler.findById (isAuthorized._id).select(
            "-password -refreshToken"
        )

        if (!user) {
            throw new apiError(401 ,"Unauthorized request");
        }

        req.user = user ;
        next();
        
    } catch (error) {
        throw new apiError(401 , error?.message || "Unauthorized request")
    }

});

// const verifyClient = asyncHandler( async (req, _ , next) => {
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") ;
//         if (!token) {
//             throw new apiError("Unauthorized request");
//         }
    
//         const isAuthorized = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) ;
    
//         const user = await client.findById (isAuthorized._id).select(
//             "-password -refreshToken"
//         )

//         if (!user) {
//             throw new apiError(401 ,"Unauthorized request");
//         }

//         req.user = client ;
//         next();
        
//     } catch (error) {
//         throw new apiError(401 , error?.message || "Unauthorized request")
//     }
// });

// export {verifyJWT} 