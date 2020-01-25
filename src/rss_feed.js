const builder = require('xmlbuilder');
const aws = require('aws-sdk');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

function fileListToChannels(fileList) {
  let channels = {};

  fileList.forEach((f) => {
    const comps = f.split('/');

    if (comps.length < 2) return; // ignore objects at root

    const folder = comps[0].replace(/ /g, '+');
    const file = comps[1].replace(/ /g, '+');

    if (!file.endsWith('.mp3')) return;

    if (channels[folder] == undefined) {
      channels[folder] = [];
    }
    if (file.length > 0) {
      channels[folder].push(file);
    }
  });

  return channels;
}

function buildEpisode(rss, episode) {
  const episodeNum = episode.split(/[+.]/)[1];

  rss.ele('item')
    .ele('itunes:episodeType', 'full').up()
    .ele('title', episode).up()
    .ele('episode', episodeNum).up()
    .ele('itunes:title', episode).up()
    .ele('description', 'none').up()
    .ele('itunes:explicit', 'no').up()
    .ele('enclosure')
    .att('length', 498537)
    .att('type', 'audio/mpeg')
    .att('url', `https://podcasts-kk.s3.amazonaws.com/First+90+Days/${episode}`)
    .up()
    .ele('guid', `https://podcasts-kk.s3.amazonaws.com/First+90+Days/${episode}`).up()
    .ele('itunes:explicity', 'no').up()
    .ele('pubDate', new Date()).up()
    .ele('itunes:duration', 1024).up()
    ;

  return rss;
}

function buildChannel(rss, title, episodes) {
  const channel = rss.ele('channel');
  channel.ele('title', title).up()
    .ele('description', 'none').up()
    .ele('itunes:image', 'https://applehosted.podcasts.apple.com/hiking_treks/artwork.png').up()
    .ele('itunes:category').att('text', 'Business').up()
    .ele('link', 'httpss://www.apple.com/itunes/podcasts/').up()
    .ele('language', 'en-us').up()
    .ele('itunes:explicit', 'no').up()
    .ele('itunes:author', 'KK').up()
    .ele('itunes:owner', 'KK').up()
    // .ele('itunes:block', 'Yes').up()
    ;

  episodes.forEach(e => buildEpisode(channel, e));

  return rss;
}

function toXml(channels) {
  let rss = builder.create('rss', { encoding: 'utf-8' })
    .att('xmlns:itunes', 'http://www.itunes.com/dtds/podcast-1.0.dtd')
    .att('version', '2.0');

  Object.keys(channels).forEach(channel => {
    buildChannel(rss, channel, channels[channel]);
  })

  return rss.end({ pretty: true });
}

async function save(xml, bucket, fileName) {
  let params = {
    Bucket: bucket,
    Key: fileName,
    ContentType: 'text/xml',
    ACL: 'public-read',
    Body: xml,
  };

  console.log(`Saving ${fileName} to bucket ${bucket}`);

  return s3.putObject(params).promise()
}

function generateFeed(fileList) {
  const channels = fileListToChannels(fileList);
  const xml = toXml(channels);
  return xml;
}

module.exports = {
  generateFeed,
  save,
};
