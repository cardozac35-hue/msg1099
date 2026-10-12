const { execSync } = require("child_process");

function run(cmd) {
  console.log(`> ${cmd}`);
  const out = execSync(cmd, { stdio: "inherit" });
}

run("git add .");
run('git commit -m "feat: add Excel to Quote Converter with instant spreadsheet parsing and official MSG quotation PDF layout"');
run("git push origin main");
console.log("Pushed successfully to origin main!");
