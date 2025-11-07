import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://a12cb329d84130460eed99b816e4d0d3.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'dafe9d6e5448406759631b8d101c3901',
    secretAccessKey: 'd82d1ab05af875d9a6da33f06e0a8d4efb43e72119ff500f35badff4afe811b9',
  },
});

async function createBucket() {
  try {
    // Check if bucket already exists
    await s3Client.send(new HeadBucketCommand({ Bucket: 'blaze-baseball-assets' }));
    console.log('✅ Bucket already exists: blaze-baseball-assets');
  } catch (err) {
    if (err.name === 'NotFound') {
      // Bucket doesn't exist, create it
      await s3Client.send(new CreateBucketCommand({ Bucket: 'blaze-baseball-assets' }));
      console.log('✅ Created bucket: blaze-baseball-assets');
    } else {
      throw err;
    }
  }
}

createBucket().catch(console.error);
