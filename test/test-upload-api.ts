import { signToken } from "../src/lib/auth";

async function testApiUpload() {
  const adminToken = await signToken({
    id: "u_admin_1",
    email: "admin@oilgashub.com",
    name: "System Administrator",
    role: "admin",
  });

  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const fileContent = "Material Test Certificate 3.1 - Batch API Cloudinary Verification Live";
  
  // Create multipart payload
  let body = "";
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="title"\r\n\r\n`;
  body += `API Live MTC Certificate\r\n`;

  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="category"\r\n\r\n`;
  body += `material_test_certificate\r\n`;

  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="accessClassification"\r\n\r\n`;
  body += `confidential_admin_only\r\n`;

  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="mtc_batch_live.pdf"\r\n`;
  body += `Content-Type: application/pdf\r\n\r\n`;
  body += `${fileContent}\r\n`;
  body += `--${boundary}--\r\n`;

  const res = await fetch("http://localhost:3005/api/documents/upload", {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Cookie: `ogsh_session=${adminToken}`,
    },
    body: Buffer.from(body, "utf-8"),
  });

  const json = await res.json();
  console.log("Upload API response status:", res.status);
  console.log("Upload API response body:", JSON.stringify(json, null, 2));
}

testApiUpload().catch((err) => {
  console.error(err);
  process.exit(1);
});
