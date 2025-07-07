import jwt from "jsonwebtoken";
import { client } from "../models/client.model.js";
import { Hustler } from "../models/hustler.model.js";
import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";



const verifyHustlerJWT = asyncHandler( async (req, _ , next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") ;
        if (!token) {
            throw new apiError(401 , "Unauthorized request");
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
const verifyClientJWT = asyncHandler(async (req, _, next) => {
    try {
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("Raw Token:", JSON.stringify(token));

        // Remove extra quotes if present
        token = token?.replace(/^"|"$/g, "");

        if (!token) {
            throw new apiError(401, "Unauthorized request: No token provided");
        }

        const isAuthorized = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await client.findById(isAuthorized._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new apiError(401, "Unauthorized request: User not found");
        }

        req.user = user; // Attach user to the request object
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            throw new apiError(401, "Invalid Token");
        } else if (error.name === "TokenExpiredError") {
            throw new apiError(401, "Token has expired");
        } else {
            throw new apiError(401, error?.message || "Unauthorized request");
        }
    }
});

// Generic JWT verification that works for both hustlers and clients
const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        // Remove extra quotes if present
        token = token?.replace(/^"|"$/g, "");

        if (!token) {
            throw new apiError(401, "Unauthorized request: No token provided");
        }

        const isAuthorized = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Try to find user in Hustler collection first, then Client
        let user = await Hustler.findById(isAuthorized._id).select("-password -refreshToken");
        
        if (!user) {
            user = await client.findById(isAuthorized._id).select("-password -refreshToken");
        }

        if (!user) {
            throw new apiError(401, "Unauthorized request: User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            throw new apiError(401, "Invalid Token");
        } else if (error.name === "TokenExpiredError") {
            throw new apiError(401, "Token has expired");
        } else {
            throw new apiError(401, error?.message || "Unauthorized request");
        }
    }
});


export {
    verifyClientJWT, verifyHustlerJWT, verifyJWT
};

