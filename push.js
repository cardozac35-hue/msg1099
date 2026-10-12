const { execSync } = require("child_process");

function run(cmd) {
  console.log(`> ${cmd}`);
  const out = execSync(cmd, { stdio: "inherit" });
}

run("git add .");
run('git commit -m "fix: resolve prerender suspense boundaries, zod issues, and static routes for Vercel deployment"');
run("git push origin main");
console.log("Pushed successfully to origin main!");
