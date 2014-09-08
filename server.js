// Module dependencies.

// Modules locaux
var geojson = require('./lib/geojson.js');

var application_root = __dirname,
  express = require('express'); //Web framework

var nano = require('nano')('http://localhost:5984');
var dbGeo_name = "apes_iwashere";
var dbGeo = nano.use(dbGeo_name)


// Parametres BD
var per_page = 10,
  params = {
    include_docs: true,
    limit: per_page,
    descending: true
  };


//Create server
var app = express();

// Configure server
app.configure(function() {
  //parses request body and populates request.body
  app.use(express.bodyParser());

  //checks request.body for HTTP method overrides
  app.use(express.methodOverride());

  //perform route lookup based on url and HTTP method
  app.use(app.router);

  //Show all errors in development
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

function outCorsHeader(request, response) {
  response.header('Access-Control-Allow-Origin', request.headers.origin || "*");
  response.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  response.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
}

function arrondirWpy(roundloc, docToWorkOn) {
  var documentResult;
  if (roundloc != null) {
    var numToGo = parseInt(roundloc);
    documentResult = geojson.retirerWaypointTropProche(docToWorkOn, roundloc);
  } else
    documentResult = docToWorkOn;
  return documentResult;
}

//Router
/**
 * @api {post} /api/iwashere Insérer les métadonnées.
 * @apiName PostGeoInfos
 * @apiGroup I Was Here
 *
 * @apiSuccess {String} Status Confirmation d'écriture à la BD.
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"status": "Insert done"}
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "status": "Invalid object"
 *     }
 */
app.post('/api/iwashere', function(req, res) {
  outCorsHeader(req, res);
    var insToDb = req.body;
    //console.log(req.body);
    dbGeo.insert(insToDb, {}, function(err, body) {
      if (!err)
        {
		res.send('{"status": "Insert done"}');
	} else {
       	res.send('{"status": "Invalid object"}');
    }
    });
});


/**
 * @api {get} /api/iwashere/:radius/:lat/:lng Obtenir les document selon le périmètre
 * @apiName GetMarksRadius
 * @apiGroup I Was Here
 *
 * @apiParam {Number} radius Périmètre des points désirés.
 * @apiParam {Number} lat Point de latitude source.
 * @apiParam {Number} lng Point de longitude source.
 * @apiParam {Integer} [?roundloc=] Arrondir les waypoints au nombre spécifié.
 *
 * @apiSuccess {GeoJson} documentFeatures Document formatté avec la liste de waypoints selon le radius.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *   "_id": "b6191e110019328d4c8b2bedff000a7a",
 *   "_rev": "1-aabffa12807d084ccbcd63f7c51b0533",
 *   "name": "PARCOMETRE",
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [
 *           -71.2217178685479,
 *           46.803835920695
 *         ]
 *       },
 *       "properties": {
 *         "ID": "300070"
 *       }
 *     }
 * 	]
 * }
 *
 */
app.get('/api/iwashere/:radius/:lat/:lng', function(request, response) {
  outCorsHeader(request, response);
  dbGeo.list ({include_docs: true},function(err, doc) {
        var documentToSend;
        if (!err) {

      var documentToWorkOn = geojson.preparerDocumentFeaturesFromCouchView(doc);
      documentToSend = "We worked on it at least";
      if (geojson.evaluerSiTypePoint(documentToWorkOn))
      // "this is really a point document"
        documentToSend = arrondirWpy(request.query.roundloc, geojson.generateGeoJsonDocRadius(documentToWorkOn, request.params.radius, request.params.lat, request.params.lng));
      else
        documentToSend = "This is not a point document. Can't do anything";
    } else {
      documentToSend = 'could not find id!!';
    }

    response.send(documentToSend);
  });
});

//Start server
var port = 4711;
app.listen(port, function() {
  console.log('Express server listening on port %d in %s mode', port, app.settings.env);
});
