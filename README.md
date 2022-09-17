# strapi-provider-upload-aws-s3-cdn

This is a fork of [maxmastalerz/strapi-provider-upload-aws-s3-cloudfront](https://github.com/maxmastalerz/strapi-provider-upload-aws-s3-cloudfront) which has been modified support IAM-based bucket access and in theory can be used with any CDN.

For the official S3 upload provider maintained by Strapi, please see: [@strapi/provider-upload-aws-s3](https://www.npmjs.com/package/@strapi/provider-upload-aws-s3).

## Installation

```
npm install git+https://github.com/ophilbinbriscoe/strapi-provider-upload-aws-s3-cdn.git
```

## AWS configuration

1. If you haven't already, setup a CloudFront distribution from your S3 bucket:
   [How do I use my CloudFront distribution to restrict access to an Amazon S3 bucket?](https://aws.amazon.com/premiumsupport/knowledge-center/cloudfront-access-to-amazon-s3/)
2. Create a new IAM policy
   - Switch to the JSON editor and use the following template: (replacing `my-bucket` with your actual bucket name):
     ```
     {
       "Version": "2012-10-17",
       "Statement": [
        {
            "Sid": "MyBucketUploadProviderAccess",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::my-bucket"
        }
      ]
     }
     ```
   - Press **Next: Tags** and add any tags you need
   - Press **Next: Review**
      - Name the policy something like `my-bucket-upload-provider-policy`
      - Add a description, if you want
      - Double check that you've set the appropriate service/action/resource scopes
      - Hit **Create policy**
3. Create a new IAM user
   - Choose a user name (something like `my-bucket-upload-provider-user`)
   - Under *Select AWS credential type\**, check **Access key - Programmatic access**
   - Press **Next: Permissions**
   - Under *Set permissions*, choose **Attach existing policies directly** and use the search field to find the policy you created in the previous step
   - Press **Next: Tags** and add any tags you need
   - Press **Next: Review** and review
   - Press **Create user**

**IMPORTANT**

On the next page, immediately press **Download .csv** to save a copy of the credentials for this user, or copy the *Access key ID* and *Secret access key* into a secure place, such as a credential manager. You'll need them for the next steps.

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