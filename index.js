const aws = require('aws-sdk');
const rss = require('./src/rss_feed');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // ignore updates to xml files
  if (event.Records[0].s3.object.key.endsWith('.xml')) {
    console.log("Ignoring xml update");
    return "Done";
  }

  // get bucket name from the event
  const bucket = event.Records[0].s3.bucket.name;
  const params = {
    Bucket: bucket,
  };

  try {
    const { Contents } = await s3.listObjects(params).promise();
    const files = Contents.map(c => c.Key);
    // console.log('Contents', Contents);

    const feed = rss.generateFeed(bucket, files);
    console.log(feed);
    await rss.save(feed, bucket, "feed.xml");

    return "Done";
  } catch (err) {
    console.log(err);
    const message = err.message;
    console.log(message);
    throw new Error(message);
  }
};
