var mosca = require('mosca')
var request = require('request');
var undercontrolApiUrl = "http://localhost:3000/api/v1/things/measurements?api_key=:api_key&value=:value";

var ascoltatore = {
  type: 'redis',
  redis: require('redis'),
  db: 12,
  port: 6379,
  return_buffers: true, // to handle binary payloads
  host: "localhost"
};

var moscaSettings = {
  port: 1883,
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Redis
  }
};

var server = new mosca.Server(moscaSettings);
server.on('ready', setup);

server.on('clientConnected', function(client) {
  console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  console.log('Published', packet.topic, packet.payload);
  var apiKeyRegex = /things\/measurements\/([A-Za-z0-9-_]+)/
  var apiKeyMatch = packet.topic.match(apiKeyRegex);
  if(apiKeyMatch != null) {
    var apiKey = apiKeyMatch[1];
    var apiUrl = undercontrolApiUrl.replace(':api_key', apiKey).replace(':value', packet.payload.toString());
    request.get(apiUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body);
      } else {
        console.error("Invalid response from API URL:", apiUrl, error);
      }
    });
  } else {
    console.log("Invalid topic format:", packet.topic);
  }
});

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running')
}