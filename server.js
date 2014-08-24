// Module dependencies.

// Modules locaux
var geojson = require('./lib/geojson.js');

var application_root = __dirname,
  express = require('express'); //Web framework

var nano = require('nano')('http://localhost:5984');
var db_name = "demo_api";
var dbGeo_name = "geojson_api";
var boncitoyen_bd_name = "api_boncitoyen"
var db = nano.use(db_name);
var dbGeo = nano.use(dbGeo_name)
var boncitoyen_db = nano.use(boncitoyen_bd_name);


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
//Get a list of all geojson keys
/**
 * @api {get} /api/geojson Liste des sources de données GeoJson
 * @apiName GetGeoJson
 * @apiGroup GeoJson
 *
 * @apiSuccess {String} name Clé du document GeoJson.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "PARCOMETRE"
 *     }
 */
app.get('/api/geojson', function(request, response) {
  outCorsHeader(request, response);

  var totalKeys = []
  dbGeo.view("nodejs", "keys", {
    group_level: 1
  }, function(error, body, headers) {
    if (!error) {
      body.rows.forEach(function(doc) {
        totalKeys.push(doc.key);
      })
    };
    response.send(totalKeys);
  })
});

/**
 * @api {get} /api/geojson/:id Obtenir le document GeoJson
 * @apiName GetGeoJsonDetail
 * @apiGroup GeoJson
 *
 * @apiParam {String} id Nom du jeu de donnée GeoJson.
 * @apiParam {Integer} [?roundloc=] Arrondir les waypoints au nombre spécifié.
 *
 * @apiSuccess {GeoJson} documentFeatures Document formatté avec la liste de waypoints.
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
 *         "ID": "300070",
 *         "COTE_RUE": "Ouest",
 *         "LECT_MET": "208",
 *         "SEGMENT_RU": "105",
 *         "DIRECTION": null,
 *         "NOM_TOPOG": "Avenue Louis-St-Laurent",
 *         "NO_BORNE": "2371",
 *         "NO_CIVIQ": null,
 *         "ID_VOIE_PUB": 105663,
 *         "GEOM": "POINT (249714.049 5185174.046)"
 *       }
 *     }
 * 	]
 * }
 *
 */
app.get('/api/geojson/:id', function(request, response) {
  outCorsHeader(request, response);

  dbGeo.view('nodejs', 'keys', {
    include_docs: true,
    reduce: false,
    key: request.params.id
  }, function(err, doc) {
    var documentToSend;
    if (!err) {

      var realGeoJsonDoc = geojson.preparerDocumentFeaturesFromCouchView(doc, request.params.id);

      documentToSend = arrondirWpy(request.query.roundloc, realGeoJsonDoc);

    } else {
      documentToSend = 'could not find id!!';
    }

    response.send(documentToSend);
  });
});


//Get a single geojson tag by id, radius, lat, lng
/**
 * @api {get} /api/geojson/:id/:radius/:lat/:lng Obtenir le document GeoJson selon le périmètre
 * @apiName GetGeoJsonDetailRadius
 * @apiGroup GeoJson
 *
 * @apiParam {String} id Nom du jeu de donnée GeoJson.
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
 *         "ID": "300070",
 *         "COTE_RUE": "Ouest",
 *         "LECT_MET": "208",
 *         "SEGMENT_RU": "105",
 *         "DIRECTION": null,
 *         "NOM_TOPOG": "Avenue Louis-St-Laurent",
 *         "NO_BORNE": "2371",
 *         "NO_CIVIQ": null,
 *         "ID_VOIE_PUB": 105663,
 *         "GEOM": "POINT (249714.049 5185174.046)"
 *       }
 *     }
 * 	]
 * }
 *
 */
app.get('/api/geojson/:id/:radius/:lat/:lng', function(request, response) {
  outCorsHeader(request, response);

  dbGeo.view('nodejs', 'keys', {
        include_docs: true,
        reduce: false,
        key: request.params.id
      }, function(err, doc) {
        var documentToSend;
        if (!err) {

      var documentToWorkOn = geojson.preparerDocumentFeaturesFromCouchView(doc, request.params.id);
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


/**
 * @api {get} /api/geojson/:id/:latSW/:lngSW/:latNE/:lngNE Obtenir le document GeoJson selon les bounds fournis.
 * @apiName GetGeoJsonDetailBounds
 * @apiGroup GeoJson
 *
 * @apiDescription Le document GeoJson à été calculés à partir des bounds à condition que le jeu de données soit fournit en format points.
 *
 * @apiParam {String} id Nom du jeu de donnée GeoJson.
 * @apiParam {Number} latSW Point de latitude South West.
 * @apiParam {Number} lngSW Point de longitude South West.
 * @apiParam {Number} latNE Point de latitude Nord East.
 * @apiParam {Number} lngNE Point de longitude Nord East.
 * @apiParam {Integer} [?roundloc=] Arrondir les waypoints au nombre spécifié.
 *
 * @apiSuccess {GeoJson} documentFeatures Document formatté avec la liste de waypoints selon le périmètre.
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
 *         "ID": "300070",
 *         "COTE_RUE": "Ouest",
 *         "LECT_MET": "208",
 *         "SEGMENT_RU": "105",
 *         "DIRECTION": null,
 *         "NOM_TOPOG": "Avenue Louis-St-Laurent",
 *         "NO_BORNE": "2371",
 *         "NO_CIVIQ": null,
 *         "ID_VOIE_PUB": 105663,
 *         "GEOM": "POINT (249714.049 5185174.046)"
 *       }
 *     }
 * 	]
 * }
 *
 */
app.get('/api/geojson/:id/:latSW/:lngSW/:latNE/:lngNE', function(request, response) {
  outCorsHeader(request, response);

  dbGeo.view('datasets', request.params.id, {
        include_docs: true,
        reduce: false
      }, function(err, doc) {
        var documentToSend;
        if (!err) {

      var documentToWorkOn = geojson.preparerDocumentFeaturesFromCouchView(doc, request.params.id);
      documentToSend = "We worked on it at least";
      if (geojson.evaluerSiTypePoint(documentToWorkOn) || geojson.evaluerSiTypePolygon(documentToWorkOn))
      // "this is really a point document"
        documentToSend = arrondirWpy(request.query.roundloc, geojson.generateGeoJsonDocBounds(documentToWorkOn, request.params.latSW, request.params.lngSW, request.params.latNE, request.params.lngNE));
      else
        documentToSend = "This is not a point document. Can't do anything";
    } else {
      documentToSend = 'could not find id!!';
    }

    response.send(documentToSend);
  });
});


/**
 * @api {post} /api/boncitoyen Insérer une plainte
 * @apiName PostBonCityon
 * @apiGroup BonCitoyen
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
app.post('/api/boncitoyen', function(req, res) {
  outCorsHeader(req, res);
  if (boncitoyen.validerStructureJsonBonCitoyen(req.body)) {
    var insToDb = req.body;
    insToDb.status = 1; // 0 Déclaré, 1 En Cours, 2 Résolu !

    boncitoyen_db.insert(insToDb, {}, function(err, body) {
      if (!err)
      //  console.log("insert done into couchdb !!!");
        realtime.sendResponseToClient(res, "{\"status\": \"Insert done\"}", 'boncitoyen', 'insert');
    });
  } else
    res.send("{\"status\": \"Invalid object\"}");
});

/**
 * @api {get} /api/boncitoyen Liste des plaintes.
 * @apiName GetBonCitoyen
 * @apiGroup BonCitoyen
 *
 * @apiSuccess {String} name Clé du document de plainte.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "name": "PlainteFeuVQ23"
 *     }
 */
app.get('/api/boncitoyen', function(request, response) {
  outCorsHeader(request, response);
  var totalKeys = [];
  boncitoyen_db.view("nodejs", "main", function(error, body, headers) {
    if (!error) {
      body.rows.forEach(function(doc) {
        totalKeys.push(doc.value);
      })
    };
    response.send(totalKeys);
  });
});


/**
 * @api {get} /api/boncitoyen/:id Obtenir un incident
 * @apiName GetBonCitoyenDetail
 * @apiGroup BonCitoyen
 *
 * @apiParam {String} id Clé du document de plainte.
 *
 * @apiSuccess {Json} document Document de la plainte.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "_id": "450a953e7f682c8bc8c6f3909f0006b3",
 *  "_rev": "2-61ceeafbac1203dc44e822171b5a2083",
 *  "titre": "generated317",
 *  "type": "Debris voiture",
 *  "lat": "46.10989756847276",
 *  "lng": "-64.6160888671875",
 *  "description": "Il y a une plume de oiseau dans la rue.",
 *  "status": 2
 * }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "fetch error"
 *     }
 *
 */
app.get('/api/boncitoyen/:id', function(request, response) {
  outCorsHeader(request, response);

  boncitoyen_db.view('nodejs', 'keys', {
    keys: [request.params.id]
  }, function(err, doc) {
    var documentToSend;
    if (!err) {
      documentToSend = doc.rows[0].value;
    } else {
      documentToSend = '{"status": "fetch error"}';
    }

    response.send(documentToSend);
  });
});

/**
 * @api {get} /api/boncitoyen/:id/status Obtenir status d'un incident
 * @apiName GetBonCitoyenDetailStatus
 * @apiGroup BonCitoyen
 *
 * @apiParam {String} id Clé du document de plainte.
 *
 * @apiSuccess {Json} document Status de la plainte.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *   "status": 2
 * }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "fetch error"
 *     }
 *
 */
app.get('/api/boncitoyen/:id/status', function(request, response) {
  outCorsHeader(request, response);

  boncitoyen_db.view('nodejs', 'keys', {
    keys: [request.params.id]
  }, function(err, doc) {
    var documentToSend;
    if (!err) {
      documentToSend = {
        status: doc.rows[0].value.status
      };
    } else {
      documentToSend = '{"status": "fetch error"}';
    }

    response.send(documentToSend);
  });
});

/**
 * @api {post} /api/boncitoyen/:id/status Mettre à jour status d'un incident
 * @apiName PostBonCitoyenDetailStatus
 * @apiGroup BonCitoyen
 *
 * @apiParam {String} id Clé du document de plainte.
 * @apiParam {String} PutData Json avec attribut Status désiré.
 *
 * @apiSuccess {Json} document Confirmation d'ecriture de la plainte.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *   "status": "Update done"
 * }
 *
 * @apiErrorExample Error-Response lors du fetch:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "fetch error"
 *     }
 *
 * @apiErrorExample Error-Response lors du insert:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "fetch error"
 *     }
 *
 */
app.post('/api/boncitoyen/:id/status', function(request, response) {
  outCorsHeader(request, response);
  var apiName = 'boncitoyen';
  var putData = request.body;
  var documentToSend;

  putData.status = isNaN(parseInt(putData.status)) ? 0 : parseInt(putData.status);

  if (boncitoyen.validerStatus(putData.status)) {
    boncitoyen_db.view('nodejs', 'keys', {
      keys: [request.params.id]
    }, function(err, doc) {

      if (!err) {
        documentToSend = doc.rows[0].value;
        documentToSend.status = putData.status;

        // Do the insert dude !
        boncitoyen_db.insert(documentToSend, documentToSend._id, function(err, body) {
          if (!err)
          //  console.log("insert done into couchdb !!!");
          // Sending notification API and response.
            realtime.sendResponseToClient(response, "{\"status\": \"Update done\"}", 'boncitoyen', 'update');
          else
            response.send("{\"status\": \"Invalid object\"}");
        });
      } else {
        documentToSend = '{"status": "fetch error"}';
        response.send(documentToSend);
      }
    });
  } else {
    documentToSend = '{"status": "invalid status"}';
    response.send(documentToSend);
  }
});



/**
 * @api {get} /api/boncitoyen/:latSW/:lngSW/:latNE/:lngNE  Document GeoJson selon les lat-lng bounds.
 * @apiName GetBonCitoyenDetailBounds
 * @apiGroup BonCitoyen
 *
 * @apiDescription Le document GeoJson des plaintes boncitoyen à été calculés à partir des bounds fournit.
 *
 * @apiParam {Number} latSW Point de latitude South West.
 * @apiParam {Number} lngSW Point de longitude South West.
 * @apiParam {Number} latNE Point de latitude Nord East.
 * @apiParam {Number} lngNE Point de longitude Nord East.
 *
 * @apiSuccess {GeoJson} documentFeatures Document formatté avec la liste de waypoints selon le périmètre.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "name": "BONCITOYEN",
 *  "type": "FeatureCollection",
 *  "features": [
 *    {
 *      "type": "Feature",
 *      "geometry": {
 *        "type": "Point",
 *        "coordinates": [
 *          "-64.63651657104492",
 *          "46.12405781339444"
 *        ]
 *      },
 *      "properties": {
 *      "TITRE": "generated303",
 *      "TYPE": "Debris voiture",
 *      "DESCRIPTION": "Il y a une plume de oiseau dans la rue.",
 *      "STATUS": 1
 *   }
 *   }
 * ]
 * }
 *
 */
app.get('/api/boncitoyen/:latSW/:lngSW/:latNE/:lngNE', function(request, response) {
  outCorsHeader(request, response);
  var totalKeys = [];
  boncitoyen_db.view("nodejs", "keys", function(error, body, headers) {
    if (!error) {
      body.rows.forEach(function(doc) {
        totalKeys.push(doc.value);
      })
    };

    // We have to filter and generate geoJson compatible format !
    var resFiltred = boncitoyen.genGeoJsonFilterBounds(totalKeys, request.params.latSW, request.params.lngSW, request.params.latNE, request.params.lngNE);
    response.send(resFiltred);
  });
});


// Fonctionalités de login logout
/**
 * @api {post} /api/authentication/login  Login.
 * @apiName PostLogin
 * @apiGroup Authentication
 *
 * @apiDescription Permet d'obtenir un token JWT pour utiliser les services privés de l'api...
 *
 * @apiParam {String} Username Nom d'utilisateur.
 * @apiParam {String} Password Mot de passe de l'utilisateur.
 *
 * @apiSuccess {Json} tokenjson Json contenant le token JWT de l'utilisateur.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InRvdG8ifQ.F_zoMFWttE1T1GVfQqxktRHxepPYe5v2Oi4Hc6s7u74"
 * }
 *
 */
app.post('/api/authentication/login', function(request, response) {
  outCorsHeader(request, response);
  var putData = request.body;
  authentication.fournirTokenLogin(putData.login, putData.password, response);
});

/**
 * @api {post} /api/authentication/register  Register.
 * @apiName PostRegister
 * @apiGroup Authentication
 *
 * @apiDescription Permet d'ajouter un utilisateur et d'obtenir une confirmation...
 *
 * @apiParam {String} Username Nom d'utilisateur.
 * @apiParam {String} Password Mot de passe de l'utilisateur.
 *
 * @apiSuccess {Json} valJson Json qui valide l'inscription au service.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "result": "RegisterSuccess"
 * }
 *
 */
app.post('/api/authentication/register', function(request, response) {
  outCorsHeader(request, response);
  var putData = request.body;
  authentication.ajouterUser(putData, response);
});

//Start server
var port = 4711;
app.listen(port, function() {
  console.log('Express server listening on port %d in %s mode', port, app.settings.env);
});
