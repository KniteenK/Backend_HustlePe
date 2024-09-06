import mongoose from "mongoose";

const organizationMemberSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  hustler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hustler',
    required: true,
  },
  role: {
    type: String,
    enum: ['member', 'senior', 'leader'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  }
});

const OrganizationMember = mongoose.model('OrganizationMember', organizationMemberSchema);
module.exports = OrganizationMember;
