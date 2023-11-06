import mongoose from "mongoose";

const connectDb = async () => {
  try {
    console.log(`from--`, process.env.MONGO_URI)
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "chatbot",
    });
    console.log(`MongoDb Connected ${conn.connection.host} `);
  } catch (error) {
    console.log(`Error ${error.message}`);
    process.exit(1);
  }
};

export default connectDb;
