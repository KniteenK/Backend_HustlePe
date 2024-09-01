import asyncHandler from "../utils/asyncHandler";


const postGig = asyncHandler ( async (req , res) => {
    const {title , description , deadline } = req.body;
}) ;

export {
    postGig,
}