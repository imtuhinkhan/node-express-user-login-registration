import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { Int32, Timestamp } from "mongodb";
import { sendEmail } from "../controllers/sendMailController.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    website: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    passwordResetToken: {
      type: String,
      trim: true,
    },
    passwordResetTokenExp: {
      type: Date,
      trim: true,
    },
    emailVerifyToken: {
      type: String,
      trim: true,
    },
    userType: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.webToken = async function () {
  const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRTE);
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

userSchema.statics.findByCredential = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    return "no-user";
  }
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    return false;
  }

  if (user && !user.isActive) {
    return "deactivated";
  }
  // if (user.emailVerifyToken) {
  //   return "verify-email";
  // }
  const token = jwt.sign(
    { id: user.id, userType: user.userType },
    process.env.JWT_SECRTE,
    { expiresIn: "24h" }
  );
  user.token = token;
  const data = {
    data: user,
    token: token,
  };
  return data;
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcryptjs.hash(this.password, 8);
  }
  next();
});

export function generateRandomString(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const User = mongoose.model("Users", userSchema);

export default User;
