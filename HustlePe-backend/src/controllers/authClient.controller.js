import asyncHandler from "../utils/asyncHandler.js"
import { client } from "../models/client.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

const signUpClient = asyncHandler ( async (req , res) => {
    const {username , email , password , contactNumber , city , country , organisation} = req.body ;

    if (
        [username, email, password, contactNumber , city, country, organisation].some((field) => field.trmi === "")
    ){
        throw new Error("All fields are required") ;
    }

    const isExisting = await client.findOne({
        $or: [{ username }, { email }]
    }) ;

    if (isExisting) {
        throw new Error("Client already exists") ;
    } ;

    const avatarLocalPath = req.files?.avatar?.[0]?.path ;
    const coverImageLocalPath = req.files?.avatar?.[0]?.path ;

    if (!avatarLocalPath) {
        throw new Error("Avatar is required") ;
    }

    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
    if (!uploadedAvatar) {
        throw new apiError(500, "Failed to upload avatar");
    }

    let uploadedCoverImage;
    if (coverImageLocalPath) {
        uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!uploadedCoverImage) {
            throw new apiError(500, "Failed to upload cover image");
        }
    }

    const isClient = await client.create({
        username,
        email,
        password,
        contactNumber,
        city,
        country,
        organisation,
        avatar: uploadedAvatar?.url || 'https://static.vecteezy.com/system/resources/thumbnails/027/951/137/small_2x/stylish-spectacles-guy-3d-avatar-character-illustrations-png.png',
        coverImage: uploadedCoverImage?.url || "",
        role: "client"
    }) ;

    if (!isClient) {
        throw new Error("Failed to create user") ;
    }

    return res.status(201).json(
        new apiResponse(200 , isClient , "user created successfully") 
    )

}) ;


 const signInClient = asyncHandler(async (req, res) => {
    const {email,username,password} = req.body;

    if(!email || !username){
        throw new apiError(400,"Email or username is required");
    }

    if(!password){
        throw new apiError(400,"Password is required");
    }
    const isClient = await client.findOne({
        $or: [{email},{username}]
    });

    if(!isClient){
        throw new apiError(404,"Client not found");
    }

    const isMatch = await isClient.matchPassword(password);

    if(!isMatch){
        throw new apiError(401,"Invalid password");
    }

    try {
        const Client = await client.findById(isClient._id).select("-password -refreshToken");
        const accessToken= await client.generateAccessToken();
        const refreshToken= await client.generateRefreshToken();

        Client.accessToken=accessToken;
        Client.save({ validateBeforeSave: false });        
    } catch (error) {
        throw new apiError(500, "Failed to generate access token");
    }

    const client= await client.findById(isClient._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .cookies("refreshToken" , refreshToken , options)
    .cookie("accessToken" , accessToken , options)
    .json(
        new apiResponse(200 , {
            client: client , accessToken , refreshToken
        }, "Client logged in successfully")
    )
 });


const signOutClient = asyncHandler(async (req, res) => {
    await client.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                accessToken: 1
            }
        },
        { 
            new: true  
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "Client logged Out Successfully"))
});


export {
    signUpClient,
    signInClient,
    signOutClient
} ;