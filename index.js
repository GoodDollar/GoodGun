const fs = require('fs')
const Gun = require('@gooddollar/gun/lib/server')

require('@gooddollar/gun/sea')
require('@gooddollar/gun/nts')
{
  process.on('uncaughtException', (err) => {
    console.error('Caught exception: ' + err, err.stack)
    process.exit(-1)
  });
  
  // es6-way to run IIFE
  const Config = require('./config.js')

  const {
    peers,
    gunOpts,
    mongoUrl,
    mongoPort,
    mongoQuery,
    mongoDB,
    mongoCollection,
    gunPublicS3,
    serveGun
  } = Config
  const {
    OPENSHIFT_NODEJS_PORT,
    VCAP_APP_PORT,
    PORT,
    HTTPS_KEY,
    HTTPS_CERT
  } = process.env

  const httpPort =
    OPENSHIFT_NODEJS_PORT || VCAP_APP_PORT || PORT || process.argv[2] || 8765
  let httpConfig = { port: httpPort }

  const printMemory = () => {
    let toPrint = {}
    const used = process.memoryUsage()

    for (let key in used) {
      toPrint[key] = `${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
    }

    console.log('Memory usage:', toPrint)
  }

  const httpHandler = serveGun ? Gun.serve(__dirname) : (_, res) => {
    res.statusCode = 400
    res.end()
  }

  if (HTTPS_KEY) {
    const http = require('https')

    httpConfig = {
      ...httpConfig,
      key: fs.readFileSync(HTTPS_KEY),
      cert: fs.readFileSync(HTTPS_CERT)
    }

    httpConfig.server = http.createServer(httpConfig, httpHandler)
  } else {
    const http = require('http')

    httpConfig.server = http.createServer(httpHandler)
  }

  const httpServer = httpConfig.server.listen(httpPort)

  let gunConfig = {
    peers,
    web: httpServer,
    rfs: !gunPublicS3.key && !mongoUrl, // disable default storage
    ...gunOpts
  }

  if (mongoUrl) {
    require('gun-mongo-key')

    gunConfig = {
      ...gunConfig,
      mongo: {
        host: mongoUrl,
        port: mongoPort,
        database: mongoDB,
        collection: mongoCollection,
        query: mongoQuery,
        opt: {
          poolSize: 100 // how large is the connection pool
        },
        chunkSize: 250 // see below
      }
    }
  } else if (gunPublicS3.key) {
    gunConfig.s3 = gunPublicS3
  } else {
    gunConfig.file = 'radata'
  }

  console.log({ gunConfig })

  setInterval(printMemory, 10000)
  Gun(gunConfig)

  console.log('Relay peer started on port ' + httpConfig.port + ' with /gun')
}
