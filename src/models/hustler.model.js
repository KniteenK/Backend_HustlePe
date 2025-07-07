import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Testimonial sub-schema
const testimonialSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
}, { _id: false });

// Gig rating sub-schema
const gigRatingSchema = new mongoose.Schema({
    gig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gigs',
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    feedback: {
        type: String,
        default: ''
    }
}, { _id: false });

const hustlerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
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
        // required: true,
        default: 'https://static.vecteezy.com/system/resources/thumbnails/027/951/137/small_2x/stylish-spectacles-guy-3d-avatar-character-illustrations-png.png',
    },
    refreshToken: {
        type: String,
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    is_premium: {
        type: Boolean,
        default: false,
    },
    bio: {
        type: String,
        default: '',
    },
    education: [{
        institute: {
            type: String,
            enum: [] ,
            required: true,
        },
        degree: {
            type: String,
            enum: [] ,
            required: true,
        },
        year_of_graduation: {
            type: Number,
            required: true,
        },
    }] , 
    skills: [{
        type: String,
    }],
    experience: [{
        company: {
            type: String,
            required: true,
            trim: true
        },
        position: {
            type: String,
            required: true,
            trim: true
        },
        start_date: {
            type: Date,
            required: true,
        },
        end_date: {
            type: Date,
        },
        currently_working: {
            type: Boolean,
            default: false,
        },
    }],
    resume: {
        type: String,
        default: '',
    } ,
    portfolio: {
        type: String,
        default: '',
    },
    social_links: [{
        platform: {
            type: String,
        } ,
        url: {
            type: String,
        },
    }],
    rating: {
        type: Number ,
        default: 1,
        min: 1,
        max: 5,
    },
    testimonials: [testimonialSchema],
    current_gig: [{
        type: mongoose.Schema.Types.ObjectId , 
        ref: 'gigs',
    }] ,
    past_gigs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gigs',
    }] ,
    saved_gigs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gigs',
    }] ,
    availability: {
        type: String,
        enum: ['Available', 'Busy', 'On Break'],
        default: 'Available',
    },
    preferred_rate: {
        type: Number,
        default: 0,
    },
    languages: [{
        type: String,
    }],
    total_earnings: {
        type: Number,
        default: 0,
    },
    role: {
        type: String ,
        default: "HUSTLER" ,
    },
    // Codeforces-like overall rating
    overall_rating: {
        type: Number,
        default: 0, // Typical starting rating
        min: 0
    },
    // Individual gig ratings
    gig_ratings: [gigRatingSchema],
    
    // Organization membership
    current_organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization',
        default: null
    },
    organization_position: {
        type: String,
        default: ''
    },
    organization_join_date: {
        type: Date,
        default: null
    },

}, {timestamps: true}) ;


hustlerSchema.pre("save" , async function (next) {
    if (!this.isModified("password")) return next() ;
    
    this.password = await bcrypt.hash(this.password , 10) ;
    next() ;
  })
  
hustlerSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password) ;
}
  
hustlerSchema.methods.generateAccessToken = async function () {
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
hustlerSchema.methods.generateRefreshToken = async function () {
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


export const Hustler = mongoose.model('Hustler' , hustlerSchema) ;