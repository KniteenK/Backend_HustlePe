import { Hustler } from "../models/hustler.model.js";
import { client } from "../models/client.model.js";  // Ensure client model is properly named (capitalized)
import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiResponse from "../utils/apiResponse.js"; 

const signIn = asyncHandler(async (req, res) => {
    // console.log('Request Body:', req.body);
    const { email, username, password } = req.body ;
    // console.log(email, username, password)

    // Ensure at least one of email or username is provided
    if (!email && !username) {
        throw new apiError(400, "Email or username is required");
    }

    // Create query condition based on whether email or username is provided
    const query = email ? { email } : { username };

    // Search in Hustlers using email or username
    let user = await Hustler.findOne(query);

    let role = 'hustler'; // Default role is 'hustler'

    // If not found in Hustlers, search in Clients
    if (!user) {
        user = await client.findOne(query);

        if (!user) {
            throw new apiError(404, "User not found");
        }

        role = 'client';  // If user found in clients, change role to 'client'
    }

    // Check password validity
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new apiError(401, "Invalid password");
    }

    try {
        // Generate access and refresh tokens
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        console.log('accessToken:', accessToken);

        // Save refreshToken in the user document
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Select the necessary user fields, omitting sensitive data
        let userData ;
        if (role === 'client') {
            userData = await client.findById(user._id).select(
                "-password -refreshToken"
            );
        }
        else {
            userData = await Hustler.findById(user._id).select(
                "-password -refreshToken"
            );
        }

        // Cookie options for security
        const options = {
            httpOnly: true,
            secure: true
        };

        // Return response with user details and tokens
        return res.status(200)
            .json(
                new apiResponse(200, {
                    userData,
                    accessToken,
                    refreshToken,
                    role
                }, "User logged in successfully")
            );

    } catch (error) {
        throw new apiError(500, error.message || "Some error occurred while logging in");
    }
});

export default signIn;
