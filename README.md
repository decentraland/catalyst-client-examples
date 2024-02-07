# How to use

## Installation
```bash
yarn
yarn build
node dist/<name of js module>
```

## Deploy profile
* Make a copy of `.env.default` to `.env` and then populate environment variables in `.env` file.
  * `PEER_URL=https://peer.decentraland.org` (no need to set it if you are using the default value)
  * `DCL_PRIVATE_KEY=abcde...` (private key of the account that will deploy the profile)
* Update file `/etc/profiles/profile.json` with the following profile metadata.
* Optionally provide `body.png` and `face256.png` files which reflect how the profile looks.
* Run `node dist/deploy-profile.js`.

If the deployment is successful, you get a 200 response status code and a JSON response with the `creationTimestamp` set to the timestamp of the deployed 
  entity.
