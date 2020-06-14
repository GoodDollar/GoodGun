var Gun = require("gun");
var SEA = require("gun/sea");
(function () {
  var fs = require("fs");
  const Config = require("./config.js");
  var httpconfig = {
    port: process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8765,
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

  console.log(Config);
  if (process.env.HTTPS_KEY) {
    httpconfig.key = fs.readFileSync(process.env.HTTPS_KEY);
    httpconfig.cert = fs.readFileSync(process.env.HTTPS_CERT);
    httpconfig.server = require("https").createServer(httpconfig, (req, res) => {
      res.statusCode = 400;
      res.end();
    });
  } else {
    httpconfig.server = require("http").createServer((req, res) => {
      res.statusCode = 400;
      res.end();
    });
  }
  let httpserver = httpconfig.server.listen(httpconfig.port);
  let gunConfig = {
    web: httpserver,
    peers: Config.peers,
    rfs: false, //disable default storage
    ...Config.gunOpts,
  };
  if (Config.mongoUrl) {
    require("gun-mongo-key");
    gunConfig = {
      ...gunConfig,
      mongo: {
        host: Config.mongoUrl,
        port: Config.mongoPort,
        database: Config.mongoDB,
        collection: Config.mongoCollection,
        query: Config.mongoQuery,
        opt: {
          poolSize: 100, // how large is the connection pool
        },
        chunkSize: 250, // see below
      },
    };
  } else if (Config.gunPublicS3 && Config.gunPublicS3.key) {
    gunConfig.s3 = Config.gunPublicS3;
  } else {
    gunConfig.file = "radata";
  }
  console.log({ gunConfig });
  var gun = Gun(gunConfig);
  console.log("Relay peer started on port " + httpconfig.port + " with /gun");
})();
