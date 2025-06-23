import { client } from "../models/client.model.js";
import { gigs } from "../models/gigs.model.js";
import { Hustler } from "../models/hustler.model.js";
import { Proposal } from "../models/proposal.model.js";
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

    const user = await client.findById(req.user._id);
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
        isClient.address = {
            city,
            country
        };

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
        
        await gigs.findByIdAndUpdate(
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

// Fetch all gigs posted by the authenticated client
const fetchClientGigs = asyncHandler(async (req, res) => {
    const clientId = req.user._id;
    const clientGigs = await gigs.find({ client_id: clientId });
    return res.status(200).json(
        new apiResponse(200, clientGigs, "All gigs posted by this client fetched successfully")
    );
});

// Fetch all proposals for a particular gig (job) posted by the authenticated client
const getProposalsForJob = asyncHandler(async (req, res) => {
    const { gig_id } = req.params;
    if (!gig_id) {
        throw new apiError(400, "Gig ID is required");
    }

    // Ensure the gig belongs to the authenticated client
    const gig = await gigs.findOne({ _id: gig_id, client_id: req.user._id });
    if (!gig) {
        throw new apiError(403, "You are not authorized to view proposals for this gig");
    }

    const proposals = await Proposal.find({ gig: gig_id })
        .populate({
            path: "hustler",
            select: "-password -refreshToken" // fetch all hustler details except sensitive
        })
        .populate({
            path: "gig",
            select: "-__v" // fetch all gig details except __v
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new apiResponse(200, proposals, "Proposals with all details fetched successfully")
    );
});

// Accept a proposal (client accepts hustler's proposal)
const acceptProposal = asyncHandler(async (req, res) => {
    const proposal_id = req.body.proposalId;
    if (!proposal_id) {
        throw new apiError(400, "Proposal ID is required");
    }

    // Find the proposal
    const proposal = await Proposal.findById(proposal_id);
    if (!proposal) {
        throw new apiError(404, "Proposal not found");
    }

    // Ensure the gig belongs to the authenticated client
    const gig = await gigs.findOne({ _id: proposal.gig, client_id: req.user._id });
    if (!gig) {
        throw new apiError(403, "You are not authorized to accept this proposal");
    }

    // Accept this proposal
    proposal.status = "accepted";
    await proposal.save();

    // Reject all other proposals for this gig
    await Proposal.updateMany(
        { gig: proposal.gig, _id: { $ne: proposal._id } },
        { $set: { status: "rejected" } }
    );

    // Assign hustler to gig and update gig status
    gig.assigned_hustler = proposal.hustler;
    gig.status = "closed";
    await gig.save();

    // Add this gig to the hustler's current_gig array if not already present
    await Hustler.findByIdAndUpdate(
        proposal.hustler,
        { $addToSet: { current_gig: proposal.gig } }
    );

    return res.status(200).json(
        new apiResponse(200, proposal, "Proposal accepted and gig updated")
    );
});

// Reject a proposal (client rejects hustler's proposal)
const rejectProposal = asyncHandler(async (req, res) => {
    const proposal_id = req.body.proposalId;
    if (!proposal_id) {
        throw new apiError(400, "Proposal ID is required");
    }

    // Find the proposal
    const proposal = await Proposal.findById(proposal_id);
    if (!proposal) {
        throw new apiError(404, "Proposal not found");
    }

    // Ensure the gig belongs to the authenticated client
    const gig = await gigs.findOne({ _id: proposal.gig, client_id: req.user._id });
    if (!gig) {
        throw new apiError(403, "You are not authorized to reject this proposal");
    }

    // Only allow rejection if not already accepted or rejected
    if (proposal.status === "accepted") {
        throw new apiError(400, "Cannot reject an already accepted proposal");
    }
    if (proposal.status === "rejected") {
        throw new apiError(400, "Proposal is already rejected");
    }

    proposal.status = "rejected";
    await proposal.save();

    return res.status(200).json(
        new apiResponse(200, proposal, "Proposal rejected successfully")
    );
});

export {
    acceptProposal, changeAddress,
    changeContactNumber,
    changeEmail,
    changeOrganisation,
    changePassword,
    changeUsername,
    fetchClientGigs,
    getProposalsForJob,
    postGig, rejectProposal, selectHustler,
    signOutClient,
    signUpClient,
    updateAvatar,
    updateCoverImage
};

