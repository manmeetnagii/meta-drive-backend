import dotenv from "dotenv";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Files, Users } from "../db/model.js";
import { Readable } from "stream";

dotenv.config();

const bucketRegion = process.env.BUCKET_REGION;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const accessKey = process.env.ACCESS_KEY;
const bucketName = process.env.BUCKET_NAME;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

// SETTING UP NEWLY SIGNED IN USER
export const setUser = async (req, res) => {
  const { name, email, folderKey } = req.body.data;

  const params = {
    Bucket: bucketName,
    Key: folderKey + "/",
  };

  try {
    await s3.send(new PutObjectCommand(params))
    .then(async () => {
        const user = await Users.create({ name, email, folderKey });
        res.json(user);
    });
  } 
  catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
};

// GETTING THE EXISTING USER WHEN LOGGED IN
export const getuser = async (req, res) => {
  try {
    const folderKey = req.query.folderKey;
    const user = await Users.findOne({ folderKey: folderKey });
    res.json(user);
  } 
  catch (error) {
    res.send(error)
  }
};

// FILE UPLOAD CONTROLLER
export const uploadFiles = async (req, res) => {
  const folderKey = req.body.folderKey;
  const userId = req.body.userId;
  const fileName = req.file.originalname;
  const fileType = req.file.mimetype === "application/octet-stream" ? "application/dicom" : req.file.mimetype;

  console.log(fileType);
  

  const params = {
    Bucket: bucketName,
    Key: `${folderKey}/` + fileName,
    Body: req.file.buffer,
    ContentType: fileType,
  };

  const command = new PutObjectCommand(params);

 
    await s3.send(command);

    const user = await Users.findById(userId);

    const file = await Files.create({ user: userId, fileName, fileType });

    user.files.push(file._id);
    await user.save();
    res.json({ file });
   
  
};

// LISTING FILES OF LOGGED-IN USER
export const listFiles = async (req, res) => {
  const params = {
    Bucket: bucketName,
    Prefix: "dcmfiles" + "/",
  };

  try {
    const command = new ListObjectsV2Command(params);
    const data = await s3.send(command);

    const files = data.Contents.map((obj) => obj.Key.split("/").pop());

    const fileDetails = {
      files
    };

    res.json({ fileDetails });
  } 
  catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const downloadFile = async (req, res) => {
  const { folderKey, file } = req.params;

  const params = {
    Bucket: bucketName,
    Key: `${folderKey}/${file}`,
  };

  try {
    const { Body } = await s3.send(new GetObjectCommand(params));
    res.attachment(file);
    const stream = Readable.from(Body);
    stream.pipe(res);
  } 
  catch (error) {
    res.status(500).send("Error downloading a file from user's folder");
  }
};

export const deleteFile = async (req, res) => {
  const { folderKey, file } = req.params;

  const params = {
    Bucket: bucketName,
    Key: `${folderKey}/${file}`,
  };
  try {
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
    res.send("File Deleted Successfully");
  } catch (error) {
   
    res.status(500).send("Internal Server Error");
  }
};

export const openFile = async (req, res) => {
  const { folderKey, file } = req.params;

  const params = {
    Bucket: bucketName,
    Key: `${folderKey}/${file}`,
  };

  const command = new GetObjectCommand(params);
  const seconds = 60;
  const url = await getSignedUrl(s3, command, { expiresIn: seconds });

  res.send(url);
};
