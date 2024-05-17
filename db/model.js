import mongoose from "mongoose";


// USER SCHEMA
const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  folderKey:{
    type: String,
    unique: true,
  },
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
});


// FILES SCHEMA
const fileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  uploadedAt: { type: Date, default: Date.now },
});

export const Files = mongoose.model("File", fileSchema);
export const Users = mongoose.model("User", userSchema);
