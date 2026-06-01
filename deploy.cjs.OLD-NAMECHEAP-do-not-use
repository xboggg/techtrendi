const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
  user: process.env.FTP_USER || "",
  password: process.env.FTP_PASSWORD || "",
  host: process.env.FTP_HOST || "techtrendi.com",
  port: parseInt(process.env.FTP_PORT || "21", 10),
  localRoot: __dirname + "/dist",
  remoteRoot: "/public_html/",
  include: ["*", "**/*", ".htaccess"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

if (!config.user || !config.password) {
  console.error("ERROR: Set FTP_USER and FTP_PASSWORD environment variables.");
  process.exit(1);
}

ftpDeploy
  .deploy(config)
  .then((res) => console.log("Deployment finished:", res))
  .catch((err) => console.error("Deployment error:", err));
