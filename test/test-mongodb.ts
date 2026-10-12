import mongoose from "mongoose";
import dns from "dns";

// Fix Node.js DNS SRV lookup on Windows
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const uri = "mongodb+srv://cardozac35_db_user:PqOiPWmPmMzYr3UZ@cluster0.zsc3tsb.mongodb.net/oil_gas_sales_hub?retryWrites=true&w=majority&appName=Cluster0";

async function testMongo() {
  console.log("Connecting to MongoDB Atlas cluster with public DNS resolvers (8.8.8.8)...");
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB Atlas connection SUCCESSFUL!");
    console.log("Database state:", mongoose.connection.readyState);
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log("Existing collections:", collections?.map(c => c.name));
    await mongoose.disconnect();
    console.log("Disconnected cleanly.");
  } catch (err: any) {
    console.error("MongoDB Atlas connection failed:", err.message || err);
    process.exit(1);
  }
}

testMongo();
