'use strict'
// https://strapi.io/documentation/v3.x/plugins/upload.html#create-providers
// Copy of strapi-provider-upload-aws-s3 but uses cloudfront cdn
// https://github.com/strapi/strapi/tree/master/packages/strapi-provider-upload-aws-s3
/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const AWS = require('aws-sdk');

module.exports = {
  init(config) {
    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...config,
    });

    const upload = (file, customParams = {}) => {
      return new Promise((resolve, reject) => {
        // upload file on S3 bucket
        const path = file.path ? `${file.path}/` : '';
        const fullPath = config.hasOwnProperty('prefix') ? `${config.prefix}${path}` : path;
        S3.upload(
          {
            Key: `${fullPath}${file.hash}${file.ext}`,
            Body: file.stream || Buffer.from(file.buffer, 'binary'),
            ContentType: file.mime,
            ...customParams,
          },
          (err, data) => {
            if (err) {
              return reject(err);
            }

            // set the bucket file url
            if (config.cdn) {
              file.url = `${config.cdn}${data.Key}`;
            } else {
              file.url = data.Location;
            }

            resolve();
          }
        );
      });
    };

    return {
      uploadStream(file, customParams = {}) {
        return upload(file, customParams);
      },
      upload(file, customParams = {}) {
        return upload(file, customParams);
      },
      delete(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = file.path ? `${file.path}/` : '';
          const fullPath = config.hasOwnProperty('prefix') ? `${config.prefix}${path}` : path;
          S3.deleteObject(
            {
              Key: `${fullPath}${file.hash}${file.ext}`,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};