const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
  user: "techbhyx",
  password: "***REMOVED***",
  host: "techtrendi.com",
  port: 21,
  localRoot: __dirname + "/dist",
  remoteRoot: "/public_html/",
  include: ["*", "**/*", ".htaccess"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

ftpDeploy
  .deploy(config)
  .then((res) => console.log("Deployment finished:", res))
  .catch((err) => console.error("Deployment error:", err));
