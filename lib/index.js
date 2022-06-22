/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const AWS = require('aws-sdk');
const Sharp = require('sharp');
const fs = require('fs')
module.exports = {
  init(config) {
    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...config,
    });

    const uploadOptimizeCopi = (file, customParams, fileBuffer, o) =>
      new Promise(async (resolve, reject) => {
        try {

        const { format, quality, progressive, width, height, fileSuffix } = o;
        const path = file.path ? `${file.path}/` : '';

        if (!format) {
          throw new Error('Plz provide a format for each optimize file');
        }
        const resize = width ? { width, height } : {}
        // console.log(`🔃 Resizing... ${path}${file.hash}${fileSuffix}${file.ext}`);
        const buffer = await Sharp(fileBuffer)
          .ensureAlpha()
          .toFormat(format)
          // .jpeg({ quality: quality || 100, progressive: progressive || true })
          .resize(resize)
          .toBuffer();
        // console.log('✅ Resizing Done...', buffer);
        S3.upload(
          {
            Key: `${path}${file.hash}${fileSuffix}.${format}`,
            Body: Buffer.from(buffer, 'binary'),
            ACL: 'public-read',
            ContentType: `image/${format}`,
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
        )
      } catch(e) {
        return e
      }


      });

    const upload = (file, customParams = {}) =>
      new Promise((resolve, reject) => {
        const fileBuffer = file.stream ? fs.readFileSync(file.stream.path) : file.buffer;
        const promiseList = [];
        if (config.optimize) {
          const { optimizeList } = config;
          optimizeList.forEach((o) => {
            promiseList.push(
              uploadOptimizeCopi(file, customParams, fileBuffer, o)
            );
          });
        }

        // upload file on S3 bucket
        Promise.all(promiseList).then(() => {
          const path = file.path ? `${file.path}/` : '';
          S3.upload(
            {
              Key: `${path}${file.hash}${file.ext}`,
              Body: Buffer.from(fileBuffer, 'binary'),
              ACL: 'public-read',
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
      });

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
          const removeFunction = (key) => {
            return new Promise((resolve, reject) => {
              S3.deleteObject(
                {
                  Key: key,
                  ...customParams,
                },
                (err, data) => {
                  if (err) {
                    return reject(err);
                  }
    
                  resolve();
                }
              )
            })
          }

          const promiseList = [];
          const path = file.path ? `${file.path}/` : '';
          if (config.optimize) {
            const { optimizeList } = config;
            optimizeList.forEach((o) => {
              promiseList.push(
                removeFunction(`${path}${file.hash}${o.fileSuffix}.${o.format}`)
              );
            });
          }

          promiseList.push(removeFunction(`${path}${file.hash}${file.ext}`))
          Promise.all(promiseList).then(e => {
            resolve()
          }).catch((err) => {
            reject(err)
          })
          
        });
      },
    };
  },
};
