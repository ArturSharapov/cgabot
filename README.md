## Description

cgabot server application

## Installation

```bash
git clone git@github.com:ArturSharapov/cgabot.git
cd cgabot
yarn install
```

## Setting .env variables

Generate [imgbb's API](https://api.imgbb.com) key:
```bash
IMGBB_TOKEN
```

Follow [instructions](https://firebase.google.com/docs/admin/setup#initialize-sdk) and generate Firebase Private Key for Admin SDK:
```bash
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FIREBASE_DATABASE_URL
```

Specify chesscom club name:
```bash
CLUB_NAME
```

Paste chesscom-api credentials:
```bash
CHESSCOM_API_URL
CHESSCOM_API_TOKEN
```

## Running the app

```bash
yarn start:dev
```
