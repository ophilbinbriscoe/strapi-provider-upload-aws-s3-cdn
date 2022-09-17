This is a fork of [https://www.npmjs.com/package/@strapi/provider-upload-aws-s3]() which has been modified to omit any ACL parameters in the object upload step.

# Installation

```
npm install git+https://gitlab.com/Haply/web/strapi-provider-upload-aws-s3-cloudfront.git
```

## Configuration (required)

config/plugins.js:

```
module.exports = ({ env }) => {
  //...
  upload: {
    config: {
      provider: 'strapi-provider-upload-aws-s3-cloudfront',
      providerOptions: {
        accessKeyId: env('AWS_S3_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_S3_SECRET_ACCESS_KEY'),
        region: env('AWS_S3_REGION'),
        params: {
        Bucket: env('AWS_S3_BUCKET'),
        },
        cdn: env('AWS_CLOUDFRONT')
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  //...
};
```

config/middlewares.js

```
module.exports = ({ env }) => [
  //...
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', env('AWS_CLOUDFRONT'), `${env('AWS_AWS_S3_BUCKET')}.s3.${env('AWS_AWS_S3_REGION')}.amazonaws.com`],
          'media-src': ["'self'", 'data:', 'blob:', env('AWS_CLOUDFRONT'), `${env('AWS_AWS_S3_BUCKET')}.s3.${env('AWS_AWS_S3_REGION')}.amazonaws.com`],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  //...
];
```

### Adding a prefix
- Use `providerOptions: { ..., prefix: 'folder/inside/my/bucket/' }` or `providerOptions: { ..., prefix: 'all_my_object_names_start_with_' }` to set a constant prefix across all objects uploaded. Note that for the time being, modifying the prefix in a project with existing uploads will make deleting those uploads impossible.

### Troubleshooting
- Note that, for the time being, the `.env` value for `AWS_CLOUDFRONT` must be a fully formed URL, e.g. `https://cdn.mysite.xyz/`
  - Be sure not to omit the protocol part (usually `https://`) or final trailing slash `/`
  - This formatting restriction may be eased in a subsequent release
- Check that there are no other discrepancies in your `AWS_...` .env values, and avoid enclosing any of them in `'` or `"` quote marks.
- Ensure that your `provider: ...` setting in config/plugins.js is set to `strapi-provider-upload-aws-s3-cloudfront`.

### Restoring `ACL: 'public-read'` upload behaviour
- For projects relying on direct `public-read` access to their bucket for delivery (as opposed a private bucket with content delivered via a secure CloudFront distribution), it should be possible to use the `actionOptions` to specify `upload: { ACL: 'public-read' }` and `uploadStream: { ACL: 'public-read' }`.