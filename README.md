This is a fork of (maxmastalerz/strapi-provider-upload-aws-s3-cloudfront)[https://github.com/maxmastalerz/strapi-provider-upload-aws-s3-cdn] which has been modified support IAM-based bucket access.

In theory it can be used with any CDN, but has only been tested with CloudFront and may require modification to fully support another solution.

# Installation

```
npm install git+https://github.com/ophilbinbriscoe/strapi-provider-upload-aws-s3-cdn.git
```

## AWS configuration

1. (How do I use my CloudFront distribution to restrict access to an Amazon S3 bucket?)[https://aws.amazon.com/premiumsupport/knowledge-center/cloudfront-access-to-amazon-s3/]
1. 

## Strapi configuration

### Plugin config.
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
        cdn: env('AWS_S3_CDN')
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

**NOTE**
For projects that have not configured IAM-based bucket access and are still relying on direct `public-read` access to their bucket for delivery, you *must* use edit the `actionOptions` config as follows:

```
        upload: { ACL: 'public-read' },
        uploadStream: { ACL: 'public-read' }
```

#### Adding a prefix

If you have multiple projects or environments backed by the same S3 bucket, it might be helpful to have each project's Media Library store its entries at a unique path within that bucket.

Use `providerOptions: { ..., prefix: 'folder/inside/my/bucket/' }` or `providerOptions: { ..., prefix: 'all_my_object_names_start_with_' }` to set a constant prefix across all objects uploaded.

For example:
| project / env | bucket | prefix |
|:--|:--|:--|
| my-cms (instance 1) | my-bucket | `cms/1/` |
| my-cms (instance 2) | my-bucket | `cms/2/` |
| my-other-project | my-bucket | `other/` |

**WARNING**
Modifying the prefix config value in a project with existing uploads is not supported, and will cause S3 bucket objects to persist whenever their entries are removed from the Media Library.

### Middleware config.

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
          'img-src': ["'self'", 'data:', 'blob:', env('AWS_S3_CDN'), `${env('AWS_AWS_S3_BUCKET')}.s3.${env('AWS_AWS_S3_REGION')}.amazonaws.com`],
          'media-src': ["'self'", 'data:', 'blob:', env('AWS_CLOUDFRONT'), `${env('AWS_AWS_S3_BUCKET')}.s3.${env('AWS_AWS_S3_REGION')}.amazonaws.com`],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  //...
];
```

## Troubleshooting
- For the time being, the env value for `AWS_S3_CDN` must be a fully formed URL, e.g. `https://cdn.mysite.xyz/`
  - Be sure **not** to omit the protocol (usually `https://`) or the final trailing slash `/`
  - This formatting restriction may be eased in a subsequent release
- Check that there are no other discrepancies in your `AWS_S3_...` env values, and avoid enclosing any of them in `'` or `"` quote marks.
- Ensure that your `provider: ...` setting in config/plugins.js is set to `strapi-provider-upload-aws-s3-cdn`.