(function() {
  var fs = require("fs");
  var config = {
    port:
      process.env.OPENSHIFT_NODEJS_PORT ||
      process.env.VCAP_APP_PORT ||
      process.env.PORT ||
      process.argv[2] ||
      8765
  };
  var Gun = require("gun");
  const Config = require("./config.js");

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
    config.key = fs.readFileSync(process.env.HTTPS_KEY);
    config.cert = fs.readFileSync(process.env.HTTPS_CERT);
    config.server = require("https").createServer(config, Gun.serve(__dirname));
  } else {
    config.server = require("http").createServer(Gun.serve(__dirname));
  }

  const gunConfig = { web: config.server.listen(config.port) };
  if (Config.gunPublicS3 && Config.gunPublicS3.key) {
    gunConfig.s3 = Config.gunPublicS3;
  } else {
    gunConfig.file = "radata";
  }
  console.log({ gunConfig });
  var gun = Gun(gunConfig);
  console.log("Relay peer started on port " + config.port + " with /gun");
})();
