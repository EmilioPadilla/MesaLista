import AWS from 'aws-sdk';

// Validate required environment variables
if (!process.env.R2_ACCOUNT_ID) {
  throw new Error('R2_ACCOUNT_ID environment variable is required');
}
if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('R2_ACCESS_KEY_ID environment variable is required');
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2_SECRET_ACCESS_KEY environment variable is required');
}
if (!process.env.R2_BUCKET) {
  throw new Error('R2_BUCKET environment variable is required');
}

const spacesEndpoint = new AWS.Endpoint(`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);

export const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});
