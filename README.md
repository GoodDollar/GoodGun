# GoodGun

This is a gun only server to use as a public db in GoodDapp

## Getting Started

Install and run server

```
npm install
npx start
```

## Environment Configuration

Supports s3 config via env variable in the following way

```
GUN_PUBLIC_S3={API_KEY},{API_SECRET},{BUCKET}
```

MongoDB support isn't stable. To disable it, edit the following variable in the `.env`
```
MONGO_URL=
```

## Local launch

```
npx pm2 start --only gun-local
```

To open output console:

```
npx pm2 logs
```

## Heroku

Supports heroku via `Procfile`