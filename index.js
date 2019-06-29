var fs = require("fs");
var Gun = require("gun");
var SEA = require("gun/sea");

var jwt = require("jsonwebtoken");
const Config = require("./config.js");

var httpConfig = {
  port:
    process.env.OPENSHIFT_NODEJS_PORT ||
    process.env.VCAP_APP_PORT ||
    process.env.PORT ||
    process.argv[2] ||
    8765
};

const printMemory = () => {
  const used = process.memoryUsage();
  let toPrint = {};
  for (let key in used) {
    toPrint[key] = `${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`;
  }
  console.log("Memory usage:", toPrint);
};
setInterval(printMemory, 10000);

console.log({ Config, httpConfig });
if (process.env.HTTPS_KEY) {
  httpConfig.key = fs.readFileSync(process.env.HTTPS_KEY);
  httpConfig.cert = fs.readFileSync(process.env.HTTPS_CERT);
  httpConfig.server = require("https").createServer(httpConfig);
} else {
  httpConfig.server = require("http").createServer(httpConfig);
}

const gc_delay = Config.gunGCInterval || 1 * 60 * 1000; /*1min*/
const memory = Config.gunGCMaxMemoryMB || 512;
const name = Config.name || "gooddollar";
//log connected peers information
Gun.on("opt", ctx => {
  console.log("Starting interval");
  setInterval(
    () =>
      console.log({
        GunServer: ctx.opt.name,
        Peers: Object.keys(ctx.opt.peers).length
      }),
    gc_delay
  );
});

var token = jwt.sign({ name: "admin" }, Config.jwtSecret, {
  expiresIn: 15 * 24 * 60 * 60 * 1000 // 15 days
});
console.log({ token });
const verifyClient = function(info, cb) {
  if (Config.requireAuth !== "true") cb(true);
  var token = info.req.headers.token;
  if (!token) cb(false, 401, "Unauthorized");
  else {
    jwt.verify(token, Config.jwtSecret, function(err, decoded) {
      if (err) {
        console.log("Unverified user");
        cb(false, 401, "Unauthorized");
      } else {
        info.req.user = decoded; //[1]
        cb(true);
      }
    });
  }
};

const gunConfig = {
  web: httpConfig.server.listen(httpConfig.port),
  file: name,
  gc_delay,
  memory,
  name,
  chunk: 1024 * 32,
  batch: 10,
  ws: { verifyClient }
};
if (Config.gunS3 && Config.gunS3.key) {
  console.log("Starting gun with S3:", { gc_delay, memory });
  gunConfig.s3 = Config.gunS3;
}

var gun = Gun(gunConfig);
console.log({ gunConfig });
console.log("Relay peer started on port " + httpConfig.port + " with /gun");
