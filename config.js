require("dotenv").config();
const convict = require("convict");

// Define a schema
const conf = convict({
  name: {
    format: String,
    default: "goodgun",
    env: "GUN_NAME"
  },
  peers: {
    format: Array,
    default: [],
    env: "GUN_PEERS"
  },
  gunOpts: {
    format: Object,
    description: "override or add gun opts",
    default: {
      radisk: false,
      axe: false,
      multicast: false,
      localStorage: false
    },
    env: "GUN_OPTS"
  },
  mongoUrl: {
    format: String,
    default: undefined,
    env: "MONGO_URL"
  },
  mongoPort: {
    format: "port",
    default: "27017",
    env: "MONGO_PORT"
  },
  mongoQuery: {
    format: String,
    default: "",
    env: "MONGO_QUERY"
  },
  mongoDB: {
    format: String,
    default: "test",
    env: "MONGO_DB"
  },
  mongoCollection: {
    format: String,
    default: "gun_mongo_key",
    env: "MONGO_COLLECTION"
  },
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
