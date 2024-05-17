import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import {deleteFile, downloadFile, getuser, listFiles, openFile, setUser, uploadFiles} from "./controllers/fileControllers.js";
import multer from "multer";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
.then(console.log("Database Connected"))
.then(
    app.listen(process.env.PORT || 4000, () => {
      console.log(`Listening on port ${process.env.PORT}`);
    })
);

app.post("/setUser", setUser);

app.get("/getuser", getuser);

app.post("/upload", upload.single("file"), uploadFiles);

app.get("/listFiles", listFiles);

app.get("/openFile/:folderKey/:file", openFile);

app.get("/download/:folderKey/:file", downloadFile);

app.delete("/delete/:folderKey/:file", deleteFile);

