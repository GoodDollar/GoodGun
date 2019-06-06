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
  }
  console.log({ gunConfig });
  var gun = Gun(gunConfig);
  console.log("Relay peer started on port " + config.port + " with /gun");
})();
