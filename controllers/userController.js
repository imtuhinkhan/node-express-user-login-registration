import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "./../models/User.js";
import bcryptjs from "bcryptjs";

const clientList = asyncHandler(async (req, res) => {
  let pageSize = 10; // Number of documents per page
  let pageNumber = 1; // Page number (starting from 1)

  const page = req.query.page;
  const limit = req.query.limit;
  if (page) {
    pageNumber = page;
  }
  if (limit) {
    pageSize = limit;
  }
  if (req.user.userType != 1) {
    res.status(401).json({ message: "Permission denied" });
  }
  // Calculate the skip value based on the page size and number
  const skip = (pageNumber - 1) * pageSize;
  const user = await User.find()
    .sort({ createdAt: -1 })
    .where("userType", 2)
    .skip(skip)
    .limit(pageSize)
    .exec();
  const totalCount = await User.countDocuments().where("userType", 2).exec();
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginationData = {
    currentPage: page, // Current page number
    perPage: limit, // Number of items per page
    totalPages: totalPages, // Total number of pages
    totalCount: totalCount, // Total number of items across all pages
  };
  try {
    res
      .status(200)
      .json({ message: "Client list", data: user, paginationData });
  } catch (e) {}
});

const viewClient = asyncHandler(async (req, res) => {
  try {
    if (req.params.uid) {
      const uid = req.params.uid;
      const user = await User.findById(uid);
      try {
        res.status(200).json({ message: "User details", data: user });
      } catch (e) {
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (e) {
    res.status(404).json({ message: "User not found" });
  }
});

const updateClient = asyncHandler(async (req, res) => {
  const { firstName, lastName, phoneNumber, website, uid } = req.body;

  if (!firstName) {
    return res.status(400).json({ message: "First Name is required." });
  }
  if (!lastName) {
    return res.status(400).json({ message: "Last Name is required." });
  }
  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone Number is required." });
  }
  if (!uid) {
    return res.status(400).json({ message: "uid field is missing." });
  }

  try {
    const user = await User.findByIdAndUpdate(
      uid,
      { firstName, lastName, phoneNumber, website },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ message: "User updated successfully", data: user });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: "User not found" });
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const _id = req.user.id;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "All password fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords don't match" });
  }

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(403).json({ message: "Invalid Token" });
    }

    const isMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password doesn't match" });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 8);
    await User.findOneAndUpdate({ _id }, { password: hashedPassword });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: "User Not Found." });
  }
});

const updateClientStatus = asyncHandler(async (req, res) => {
  const { isActive, uid } = req.body;

  if (isActive === undefined) {
    return res.status(400).json({ message: "isActive is required." });
  }
  if (!uid) {
    return res.status(400).json({ message: "uid field is missing." });
  }

  try {
    const user = await User.findByIdAndUpdate(uid, { isActive }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ message: "User status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: "User not found" });
  }
});

export {
  viewClient,
  clientList,
  updateClient,
  changePassword,
  updateClientStatus,
};
