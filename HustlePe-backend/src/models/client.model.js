import mongoose from 'mongoose';
import bcrypt from "bcrypt" ;
import jwt from "jsonwebtoken" 

const clientSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
        required: true,
      },
      coverImage: {
        type: String,
        default: '',
      },
      contactNumber: {
        type: String,
        required: true,
      },
      address: {
        city: {
          type: String,
          required: true,
        } ,
        country: {
          type: String,
          required: true,
        }
      },
      avatar: {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/thumbnails/027/951/137/small_2x/stylish-spectacles-guy-3d-avatar-character-illustrations-png.png',
      },
      refreshToken: {
        type: String,
      },
    organisation: {
        type: String,
        required: true,
    }, 
    current_gigs: [{
        type: mongoose.Schema.Types.ObjectId , 
        ref: 'Gig',
    }] ,
    past_gigs: [{
        type: mongoose.Schema.Types.ObjectId , 
        ref: 'Gig',
    }] ,

    ratings: {
        type: Number,
        default: 1,
        min: 1,
        max: 5,
    },
    dollars_spent: {
        type: Number,
    },
    role: {
      type: String ,
      default: "CLIENT" ,
    }
}); 

clientSchema.pre("save" , async function (next) {
    if (!this.isModified("password")) return next() ;
    
    this.password = await bcrypt.hash(this.password , 10) ;
    next() ;
})
  
clientSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password) ;
}
  
clientSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id , 
      username: this.username , 
      email: this.email
    }
    , process.env.ACCESS_TOKEN_SECRET , 
    { 
      expiresIn:  process.env.ACCESS_TOKEN_EXPIRY ,
    }  
  )
}
clientSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id ,
    }
    , process.env.ACCESS_REFRESH_TOKEN , 
    { 
      expiresIn:  process.env.REFRESH_TOKEN_EXPIRY ,
    }  
  )
}

export const client = mongoose.model('client' , clientSchema);