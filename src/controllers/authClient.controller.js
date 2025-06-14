import { client } from "../models/client.model.js";
import { gigs } from "../models/gigs.model.js";
import { apiError } from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const signUpClient = asyncHandler ( async (req , res) => {
    try {
        const {username , email , password , contactNumber , address , organisation} = req.body ;
        const { city, country } = address;
    
        if (
            [username, email, password, contactNumber , city, country, organisation].some((field) => field.trim() === "")
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
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path ;
    
    
        let uploadedAvatar ;
        if (uploadedAvatar) {
            uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
            if (!uploadedAvatar) {
                throw new apiError(500, "Failed to upload avatar");
            }
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
            address: {
                city,
                country,
              },
            organisation,
            avatar: uploadedAvatar?.url || 'https://static.vecteezy.com/system/resources/thumbnails/027/951/137/small_2x/stylish-spectacles-guy-3d-avatar-character-illustrations-png.png',
            coverImage: uploadedCoverImage?.url || "",
            role: "client"
            // overall_rating and gig_ratings will be set by default in schema
        }) ;
    
        if (!isClient) {
            throw new Error("Failed to create user") ;
        }
        
        const accessToken = isClient.generateAccessToken()
        const refreshToken = isClient.generateRefreshToken()
        isClient.accessToken = accessToken
        isClient.save({ validateBeforeSave: false })


        // console.log(isClient)

        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(201).json(
            new apiResponse(200 , {isClient , accessToken , refreshToken} , "user created successfully") 
        ).
        cookie("accessToken" , accessToken , options).
        cookie("refreshToken" , refreshToken , options)

    } catch (error) {
        console.log('error: ', error.message) ;
    }


}) ;


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

const changeEmail=  asyncHandler(async (req, res) => {
    const {password, email} = req.body;
    if (!password || password.trim() === "") {
        throw new apiError(400, "Password is required");
    }

    if (!email || email.trim() === "") {
        throw new apiError(400, "Email is required");
    }   

    const user = client.findById(req.user._id);
    if(!user){
        throw new apiError(404, "Client not found");
    }

    if(user.password!==password){
        throw new apiError(401, "Password is not correct");
    }

    const existingUser = await client.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        throw new apiError(409, "Email already taken. Please choose a different one.");
    }

    try{
        user.email=email;
        const changedEmail= await user.save({ validateBeforeSave: false });

        if(!changedEmail){
            throw new apiError(500, "Failed to change email");
        }

        return res.status(200).json(
            new apiResponse(
                200, user, "Email changed successfully"
            )
        );
    }
    catch(error){
        throw new apiError(500, "Failed to change email");
    }

});

const changeUsername = asyncHandler(async (req, res) => {
    try{
    const { username } = req.body;
    if (!username || username.trim() === "") {
        throw new apiError(400, "Username is required");
    }
    const isClient = await client.findById(req.user._id);
    if (!isClient) {
        throw new apiError(404, "Client not found");
    }

    const existingUser = await client.findOne({ username });
        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            throw new apiError(409, "Username already taken. Please choose a different one.");
    }


    isClient.username = username;
    await isClient.save({validateBeforeSave: false});

    if( isClient.username==username ){
    return res.status(200)
    .json(
        new apiResponse(200, isClient, "Username changed successfully")
        );
    }
    }
    catch(error){
        throw new apiError(500, "Failed to change username");
    }
});

const changePassword = asyncHandler ( async(req,res) =>{
    const { oldPassword,newPassword } = req.body;

    if (!oldPassword || oldPassword.trim() === "") {
        throw new apiError(400, "Old password is required");
    }

    const isClient = await client.findById(req.user._id);
    if (!isClient) {
        throw new apiError(404, "Client not found");
    }

    if(isClient.password!==oldPassword){
        throw new apiError(401,"Old password is not correct");
    }
    
    if (!password || password.trim() === "") {
        throw new apiError(400, "Password is required");
    }

    try{
        isClient.password = newPassword;
        const isChanged=await isClient.save({validateBeforeSave: false});

        if(!isChanged){
            throw new apiError(500, "Failed to change password");
        }
        if( isClient.password==password ){
            return res.status(200)
            .json(
                new apiResponse(200, isClient, "Password changed successfully")
                );
            }
        }
        catch(error){
            throw new apiError(500, "Failed to change password");
        }
});

const changeAddress = asyncHandler(async (req, res) => {
    const { city, country } = req.body;
    if (!city || city.trim() === "") {
        throw new apiError(400, "City is required");
    }

    if (!country || country.trim() === "") {
        throw new apiError(400, "Country is required");
    }

    const isClient = await client.findById(req.user._id);
    if (!isClient) {
        throw new apiError(404, "Client not found");
    }

    try{
        isClient.address = `${city}, ${country}`;

        const changedaddr= await isClient.save({ validateBeforeSave: false });

        if(!changedaddr){
            throw new apiError(500, "Failed to change address");
        }

        return res.status(200).json(
            new apiResponse(
                200, isClient, "Address changed successfully"
            )
        );
    }
    catch(error){
        throw new apiError(500, "Failed to change address");
    }
});

const updateAvatar = asyncHandler (async (req , res) => {
    const avatarLocalPath = req.file?.path 

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required");
    }
    
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!uploadedAvatar) {
        throw new apiError(500, "Failed to upload avatar");
    }

    const user = await client.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: uploadedAvatar.url
            }
        },
        {
            new: true
        }
    ).select ("-password")

    return res.status(200)
    .json(
        new apiResponse(200, user, "Avatar updated successfully")
    )

})

const updateCoverImage = asyncHandler (async (req , res) => {
    const coverLocalPath = req.file?.path 

    if (!coverLocalPath) {
        throw new apiError(400, "Cover image is required");
    }
    
    const uploadedCover = await uploadOnCloudinary(coverLocalPath);

    if (!uploadedCover) {
        throw new apiError(500, "Failed to upload cover image");
    }

    const user = await client.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: uploadedCover.url
            }
        },
        {
            new: true
        }
    ).select ("-password")

    return res.status(200)
    .json(
        new apiResponse(200, user, "Cover image updated successfully")
    )

});

const changeContactNumber = asyncHandler(async (req, res) => {
    const { contactNumber } = req.body;
    if(!contactNumber || contactNumber.trim() === ""){
        throw new apiError(400, "Contact number is required");
    }

    const user=await client.findById(req.user._id);
    if(!user){
        throw new apiError(404, "Client not found");
    }

    try{
        user.contactNumber=contactNumber;
        const changedContact= await user.save({ validateBeforeSave: false });

        if(!changedContact){
            throw new apiError(500, "Failed to change contact number");
        }

        return res.status(200).json(
            new apiResponse(
                200, user, "Contact number changed successfully"
            )
        );
    }
    catch(error){
        throw new apiError(500, "Failed to change contact number");
    }
});

const changeOrganisation = asyncHandler(async (req, res) => {
    const { organisation } = req.body;
    if(!organisation || organisation.trim() === ""){
        throw new apiError(400, "Organisation is required");
    }

    const user=await client.findById(req.user._id); 
    if(!user){
        throw new apiError(404, "Client not found");
    }

    try{
        user.organisation=organisation;
        const changedOrganisation= await user.save(
            { 
                validateBeforeSave: false 
            }
        );

        if(!changedOrganisation){
            throw new apiError(500, "Failed to change organisation");
        }

        return res.status(200).json(
            new apiResponse(
                200, user, "Organisation changed successfully"
            )
        );
    }
    catch(error){
        throw new apiError(500, "Failed to change organisation");
    }
});


const postGig = asyncHandler ( async (req , res) => {
    const {title , description , deadline , budget , skills_req , payment_option, milestones} = req.body;
    // console.log(req.user._id);
    const client_id = req.user._id
    console.log (req.body)
    // console.log(title, description, deadline, budget, skills_req , payment_option , _id);
    try {
        if (
            [title, description, deadline, budget, skills_req, payment_option]
            .some((field) => field.trim === "")
        ){
            throw new Error("All fields are required") ;
        }
    
        const gigData = {
            title,
            description,
            client_id,
            deadline,
            budget,
            skills_req,
            payment_option,
        };

        // If payment_option is 'milestone', include milestones array
        if (payment_option === 'milestone' && Array.isArray(milestones)) {
            gigData.milestones = milestones;
        }

        const gig = await gigs.create(gigData) ;
        res.status(201).json(
            new apiResponse(201, gig, "Gig created successfully")
        );
    } catch (error) {
        console.error ("error : " , error.message || 'Something went horribly wrong')
    }

}) ;

const selectHustler = asyncHandler ( async (req , res) => {
    try {
        const { gigId, hustlerId } = req.body;
        if (!gigId || !hustlerId) {
            throw new apiError(400, "Gig ID and Hustler ID are required");
        }
        
        gigs.findByIdAndUpdate(
            gigId ,
            {
                $set: {
                    assigned_hustler: hustlerId
                }
            },
            {
                new: true
            }
        )

        return res.status(200).
        json(
            new apiResponse(200, {}, "Hustler assigned to gig successfully")
        );

    } catch (error) {
        throw new apiError(500, "Failed to assign hustler to gig");
    }

})



export {
    changeAddress, changeContactNumber, changeEmail, changeOrganisation, changePassword, changeUsername, postGig, selectHustler, signOutClient, signUpClient, updateAvatar,
    updateCoverImage
};

