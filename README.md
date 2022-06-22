# strapi-provider-upload-multi-cloud-sharp-optimize

## Installation

```bash
# using yarn
yarn add strapi-provider-upload-multi-cloud-sharp-optimize
# using npm
npm install strapi-provider-upload-multi-cloud-sharp-optimize --save
```

## Configuration

- `provider` defines the name of the provider
- `providerOptions` is passed down during the construction of the provider
- `optimizeList` list of file you like to create using sharp

### Provider Configuration

`./config/plugins.js`

```js
module.exports = ({ env }) => ({
  // ...
  upload: {
     config: {
      provider: 'strapi-provider-upload-multi-cloud-sharp-optimize',
      providerOptions: {
        accessKeyId: env('CLOUD_KEY_ID'),
        secretAccessKey: env('CLOUD_SECRET'),
        params: {
          Bucket: 'showcase-web',
        },
        /* For other cloud then AWS */
        cdn: env('CLOUD_CDN'),
        region: env('REGION'),
        endpoint: env('ENPOINT'),
        s3ForcePathStyle: true,
        /* Create a copy of your files */
        optimize: true,
        optimizeList: [
            {
            fileSuffix: '_hq',
            format: 'webp',
            width: width,
            height: height
            },
            {
            fileSuffix: '_hq',
            format: 'avif',
            width: width,
            height: height
            }
        ]
      },
    }
  },
  // ...
});
```