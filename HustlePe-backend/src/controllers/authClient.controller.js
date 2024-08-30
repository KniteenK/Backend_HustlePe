import asyncHandler from "../utils/asyncHandler.js"
import { client } from "../models/client.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";

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
        avatar: uploadedAvatar.url,
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

export default signUpClient ;