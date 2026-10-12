const { execSync } = require("child_process");

try {
  console.log("Staging changes...");
  execSync("git add -A", { stdio: "inherit" });

  console.log("Committing changes...");
  execSync('git commit -m "Integrate Excel RFQ importer and MSG quotation converter directly into New Enquiry"', { stdio: "inherit" });

  console.log("Pushing to origin main...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("Push successful!");
} catch (err) {
  console.error("Git error:", err.message);
  process.exit(1);
}
