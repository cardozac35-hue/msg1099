const { execSync } = require("child_process");

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { stdio: "pipe", encoding: "utf8" });
    if (out.trim()) console.log(out.trim());
    return { success: true, output: out };
  } catch (err) {
    console.error(`Error executing '${cmd}':`, err.message);
    if (err.stdout) console.log("STDOUT:", err.stdout);
    if (err.stderr) console.error("STDERR:", err.stderr);
    return { success: false, error: err };
  }
}

console.log("=== Git Push to https://github.com/cardozac35-hue/msg1099 ===");

// 1. Git init
run("git init");

// 2. Set default branch to main
run("git branch -M main");

// 3. Configure remote
run("git remote remove origin");
run("git remote add origin https://github.com/cardozac35-hue/msg1099.git");

// 4. Git status / check untracked
run("git status --short");

// 5. Stage files (ignoring .env.local via .gitignore)
run("git add .");

// 6. Commit
run('git commit -m "feat: complete Oil & Gas Sales Hub B2B Quotation Management System"');

// 7. Push to origin main
console.log("Pushing to remote origin main...");
const pushRes = run("git push -u origin main --force");

if (pushRes.success) {
  console.log("SUCCESSFULLY PUSHED TO GITHUB!");
} else {
  console.log("Push completed with notice/error above.");
}
