import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { Hustler } from "../models/hustler.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";

const signUpHustler = asyncHandler(async (req, res) => {
    const { username, email, password, first_name, last_name, contactNumber, city, country } = req.body;

    if (
        [username, email, password, first_name, last_name, contactNumber, city, country].
        some((field) => field.trim() === "")) {
        throw new apiError(400, "All fields are required");
    }

    const isExisting = await Hustler.findOne({
        $or: [{ username }, { email }]
    });

    if (isExisting) {
        throw new apiError(409, "Hustler already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required");
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

    const user = await Hustler.create({
        username: username.toLowerCase(),
        first_name,
        last_name,
        avatar: uploadedAvatar.url ,
        email,
        password,
        avatar: uploadedAvatar?.url ,
        coverImage: uploadedCoverImage?.url || "",
        contactNumber,
        city,
        country,
        role: "hustler",
    });

    const isCreated = await Hustler.findById(user._id).select("-password -refreshToken");

    if (!isCreated) {
        throw new apiError(500, "Failed to create user");
    }

    return res.status(201).json(new apiResponse(200, isCreated, "User created successfully"));
});

const signInHustler = asyncHandler (async (req, res) => {

    const { email , username , password } = req.body ;
    if (!email && !username) {
        throw new apiError(400, "Email or username is required");
    }

    const isExist = await Hustler.findOne({
        $or: [{email} , {username}] 
    })

    if (!isExist) {
        throw new apiError(404, "User not found");
    }

    const checkPassword = await isExist.checkPassword(password) ;

    if (!checkPassword) {
        throw new apiError(401, "Invalid password");
    }

    try {
        const hustler = await Hustler.findById(isExist._id)
        const accessToken = await hustler.generateAccessToken() ;
        const refreshToken = await hustler.generateRefreshToken() ;

        hustler.accessToken = accessToken ;
        hustler.save({ validateBeforeSave: false }) ;
    } catch (error) {
        throw new apiError(500, "Failed to generate access token");
    }

    const user = await Hustler.findById(isExist._id).select(
        "-password -refreshToken"
    ); 

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200).
    cookies("refreshToken" , refreshToken , options).
    cookie("accessToken" , accessToken , options).
    json(
        new apiResponse(200 , {
            user: user , accessToken , refreshToken
        }, "User logged in successfully")
    )

});

const logoutHustler = asyncHandler(async(req, res) => {
    await Hustler.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
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
    .json(new apiResponse(200, {}, "User logged Out"))
})

export {
    signUpHustler,
    signInHustler,
    logoutHustler,
} 
