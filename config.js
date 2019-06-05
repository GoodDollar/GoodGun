require("dotenv").config();
const convict = require("convict");

// Define a schema
const conf = convict({
  gunPublicS3: {
    key: {
      format: "*",
      default: undefined
    },
    secret: {
      format: "*",
      default: undefined
    },
    bucket: {
      format: "*",
      default: undefined
    }
  }
});

const publicS3 = process.env.GUN_PUBLIC_S3;
if (publicS3) {
  let s3Vals = publicS3.split(",");
  let s3Conf = { key: s3Vals[0], secret: s3Vals[1], bucket: s3Vals[2] };
  conf.set("gunPublicS3", s3Conf);
}
// Perform validation
conf.validate({ allowed: "strict" });
// eslint-disable-next-line

module.exports = conf.getProperties();
