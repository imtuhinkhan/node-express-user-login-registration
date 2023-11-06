import asyncHandler from "express-async-handler";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./../models/User.js";

import { sendMailOnPasswordForget } from "../controllers/sendMailController.js";

const register = asyncHandler(async (req, res) => {
  try {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    const website = req.body.website;
    const password = req.body.password;
    const userType = 2;
    // const phoneNumber = req.body.phoneNumber;
    // const organizationName = req.body.organizationName;
    // const tokenLength = 20;
    // const emailVerifyToken = jwt.sign(
    //   { data: generateRandomString(tokenLength) },
    //   process.env.JWT_SECRTE
    // );
    // const frontEndUrl =
    //   process.env.FRONTEND_URL +
    //   "/verify-email?emailVerifyToken=" +
    //   emailVerifyToken;

    // const superUsers = await User.find().where("userType", 1).exec();

    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      website,
      password,
      userType,
    });

    try {
      await user.save();
      // await sendMailToNewUser(frontEndUrl, email);
      // superUsers.forEach(async (superUser) => {
      //   await sendMailToSuperUsers(user, superUser.email);
      // });
      const token = jwt.sign(
        { id: user.id, userType: user.userType },
        process.env.JWT_SECRTE,
        { expiresIn: "24h" }
      );
      user.token = token;
      res.status(201).json({
        message: "Registration successful",
        data: user,
        token: token,
      });
    } catch (e) {
      if (e.code && e.code === 11000) {
        res.status(400).json({ message: "Email already exist." });
      }
      res.status(400).json({ message: "Something went wrong" });
    }
  } catch (e) {
    res.status(400).json({ message: "Something went wrong" });
  }
});

const postLogin = asyncHandler(async (req, res) => {
  try {
    const response = await User.findByCredential(
      req.body.email,
      req.body.password
    );
    if (response && response == "no-user") {
      res.status(404).json({ message: "No user found" });
    } else if (response && response == "verify-email") {
      res
        .status(403)
        .json({ message: "Please verify your email first, then try again" });
    } else if (response && response == "deactivated") {
      res
        .status(403)
        .json({
          message:
            "Your account has been deactivated. Please contact our support team.",
        });
    } else if (response) {
      res.json(response);
    } else {
      res.status(401).json({ message: "Password do not match" });
    }
  } catch (e) {
    res.json(e);
  }
});

const emailVerification = asyncHandler(async (req, res) => {
  try {
    //  need to ask Tuhin Bhai that can I use FindOneAndUpdate ?
    const response = await User.findOne({ emailVerifyToken: req.body.eToken });
    const _id = response?._id;
    if (_id) {
      const firstName = response.firstName;
      const lastName = response.lastName;
      const email = response.email;
      const userType = response.userType;
      const phoneNumber = response.phoneNumber;
      const organizationName = response.organizationName;
      const user = await User.findByIdAndUpdate(_id, {
        firstName,
        lastName,
        email,
        userType,
        phoneNumber,
        organizationName,
        emailVerifyToken: null,
      });
      try {
        await user.save();
        res.status(200).json({ message: "User updated successfully" });
      } catch (e) {
        // console.log(e);
        res.status(500).json({ message: "Internal server Error" });
      }
    } else {
      // console.log({ response });
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (e) {
    // console.log(e);
    res.status(401).json({ message: "Invalid token" });
  }
});

const forgetPassword = asyncHandler(async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      res.status(400).json({ message: "Your Email Address is required" });
    }
    try {
      const resetToken = jwt.sign({ email: email }, process.env.JWT_SECRTE);
      // Expire in one hour
      const expirationTime = Date.now() + 60 * 60 * 1000;
      const frontEndUrl =
        process.env.FRONTEND_URL +
        "/verify-reset-pass-token?resetPassToken=" +
        resetToken;
      // await sendMailToNewUser(frontEndUrl, email);
      const updatedUser = await User.findOneAndUpdate(
        { email },
        {
          passwordResetToken: resetToken,
          passwordResetTokenExp: expirationTime,
        },
        { new: true } // Return updated document
      );

      if (updatedUser && updatedUser._id) {
        await sendMailOnPasswordForget(frontEndUrl, email);
        res.status(200).json({
          message: "Please check your email to reset your password",
        });
      }
    } catch (e) {
      console.log(e);
      res.status(404).json({ message: "No user found" });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Somthing went wrong" });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  try {
    const resetToken = req.body.resetToken;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    if (!resetToken) {
      return res.status(400).json({ message: "Reset Token is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!confirmPassword) {
      return res.status(400).json({ message: "Confirm Password is required" });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password & Confirm Password don't match" });
    }

    const user = await User.findOne({ passwordResetToken: resetToken });
    if (!user) {
      return res.status(400).json({ message: "Token expired" });
    }
    if (
      user.passwordResetTokenExp &&
      Date.now() < Date.parse(user.passwordResetTokenExp)
    ) {
      try {
        await User.findOneAndUpdate(
          { _id: user._id },
          {
            $set: {
              password: await bcryptjs.hash(password, 8),
              passwordResetToken: null,
              passwordResetTokenExp: null,
            },
          }
        );
        // console.log({ upd });
        res.status(200).json({ message: "Password is updated" });
      } catch (err) {
        console.log(e);
        res.status(500).json({ message: "Something went wrong" });
      }
    } else {
      return res.status(400).json({ message: "Reset Password Token expired" });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "No user found" });
  }
});

export {
  postLogin,
  register,
  emailVerification,
  forgetPassword,
  resetPassword,
};
