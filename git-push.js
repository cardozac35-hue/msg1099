const { execSync } = require("child_process");

try {
  console.log("Staging changes...");
  execSync("git add -A", { stdio: "inherit" });

  console.log("Committing changes...");
  execSync('git commit -m "Fix Excel parser: add xlsx SheetJS multi-engine support for legacy .xls, HTML tables, and non-zip formats"', { stdio: "inherit" });

  console.log("Pushing to origin main...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("Push successful!");
} catch (err) {
  console.error("Git error:", err.message);
  process.exit(1);
}
