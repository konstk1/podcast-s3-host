const aws = require('aws-sdk');
const rss = require('./src/rss_feed');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;
  const params = {
    Bucket: bucket,
  };

  try {
    const { Contents } = await s3.listObjects(params).promise();
    const files = Contents.map(c => c.Key);
    // console.log('Contents', files);

    const feed = rss.generateFeed(files);
    console.log(feed);
    await rss.save(feed, bucket, "feed.xml");

    return "Done";
  } catch (err) {
    console.log(err);
    const message = err.message;
    //`Error getting objectsfrom bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(message);
    throw new Error(message);
  }
};
