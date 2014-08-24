// Service de API Notification (Temps Reel)
var faye = require('faye');
var clientFaye = new faye.Client('http://127.0.0.1:4700/faye');

function sendNotificationToClient(apiDataSet, operationDone) {
  var publication = clientFaye.publish('/apiOperations', {
    name: apiDataSet,
    status: operationDone
  });

  publication.then(function() {
    console.log('Message sent to notification API!');
  }, function(error) {
    console.log('There was a problem: ' + error.message);
  });

}

// Fonction pour envoyer une notification puis transmettre la reponse au client
exports.sendResponseToClient = function(response, resData, apiDataSet, operationDone) {
  sendNotificationToClient(apiDataSet, operationDone);
  response.send(resData);
}
