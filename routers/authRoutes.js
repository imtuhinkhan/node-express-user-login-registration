import express from "express";
import {
  emailVerification,
  forgetPassword,
  postLogin,
  register,
  resetPassword,
} from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.route("/auth/login").post(postLogin);
authRouter.route("/auth/register").post(register);
authRouter.route("/auth/email-verify").put(emailVerification);
authRouter.route("/auth/forgot-password").put(forgetPassword);
authRouter.route("/auth/reset-password").put(resetPassword);

export default authRouter;
