import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const dbInstance = await mongoose.connect(`${process.env.MONGODB_URI}/HustlePe`) ;
        console.log("MongoDB connected successfully");

        // console.log("mongodb is connected on the server: ", dbInstance.connection.host ) ;
    } catch (error) {
        console.log("Mongodb connection error ", error) ;
        process.exit(1);
    }
}

export default connectDB;