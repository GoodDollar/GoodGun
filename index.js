(function() {
  var fs = require("fs");
  const Config = require("./config.js");
  var httpconfig = {
    port:
      process.env.OPENSHIFT_NODEJS_PORT ||
      process.env.VCAP_APP_PORT ||
      process.env.PORT ||
      process.argv[2] ||
      8765
  };
  var Gun = require("gun");

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
    httpconfig.server = require("https").createServer(
      httpconfig,
      Gun.serve(__dirname)
    );
  } else {
    httpconfig.server = require("http").createServer(Gun.serve(__dirname));
  }

  let gunConfig = {
    web: httpconfig.server.listen(httpconfig.port),
    file: Config.name,
    axe: false,
    radisk: true,
    multicast: false,
    peers: Config.peers
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
          poolSize: 100 // how large is the connection pool
        },
        chunkSize: 250 // see below
      }
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
