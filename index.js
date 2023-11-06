import express from "express";
import dotEnv from "dotenv";
import authRoutes from "./routers/authRoutes.js";
import bodyParser from "body-parser";
import connectDb from "./config/db.js";
import cors from "cors";

dotEnv.config();
const app = express();
var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));
connectDb();

app.use(express.json());
// Middleware to authenticate the JWT token

app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send(" API is running....");
});

const Port = process.env.PORT || 8080;
app.listen(Port, console.log("Listening to port ", Port));
