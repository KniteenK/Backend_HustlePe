import { Hustler } from "../models/hustler.model.js";
import { client } from "../models/client.model.js";  // Ensure client model is properly named (capitalized)
import {apiError} from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiResponse from "../utils/apiResponse.js"; 

const signIn = asyncHandler(async (req, res) => {

    const { email , password } = req.body ;
    
    // if (!username) {
    //     throw new apiError(400, "Email or username is required");
    // }

    let user = await Hustler.findOne({
        $or: [{ email }]
    });

    // If not found in Hustlers, search in Clients
    let role = 'hustler'; // Default role as hustler
    if (!user) {
        user = await client.findOne({
            $or: [{ email }]
        });

        if (!user) {
            throw new apiError(404, "User not found");
        }

        role = 'client';  // If user found in clients, change role
    }

    // Check password
    const checkPassword = await user.isPasswordCorrect(password);

    if (!checkPassword) {
        throw new apiError(401, "Invalid password");
    }

    try {
        // Generate tokens based on role
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // Save accessToken for hustler or client (without validation before save)
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Select user fields to return, omitting sensitive data
        const userData = await user.constructor.findById(user._id).select(
            "-password -refreshToken"
        );

        // Setting cookie options (for security and HTTP-only access)
        const options = {
            httpOnly: true,
            secure: true
        };

        // Return response with both access and refresh tokens, along with user details
        return res.status(200)
            .cookie("refreshToken", refreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new apiResponse(200, {
                    user: userData, 
                    accessToken, 
                    refreshToken,
                    role
                }, "User logged in successfully")
            );

    } catch (error) {
        throw new apiError(500, error.message || "Failed to generate access token");
    }
});

export default signIn;
