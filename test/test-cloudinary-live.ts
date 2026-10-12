import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Parse .env.local manually
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        process.env[key] = val;
      }
    }
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testCloudinary() {
  console.log("Testing Cloudinary connectivity with cloud:", process.env.CLOUDINARY_CLOUD_NAME);
  try {
    const pingResult = await cloudinary.api.ping();
    console.log("Cloudinary ping result:", JSON.stringify(pingResult));

    // Upload a small test buffer
    const testBuffer = Buffer.from("Oil & Gas Sales Hub live document test " + new Date().toISOString());
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "oil_gas_hub/test",
          resource_type: "raw",
          public_id: `live_test_${Date.now()}.txt`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(testBuffer);
    });

    console.log("Upload succeeded! Public ID:", (uploadResult as any).public_id);
    console.log("Secure URL:", (uploadResult as any).secure_url);
    console.log("Cloudinary Integration Verified successfully!");
  } catch (err: any) {
    console.error("Cloudinary test failed:", err.message || err);
    process.exit(1);
  }
}

testCloudinary();
