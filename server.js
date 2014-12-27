/*
This file is part of I was here API.

I was here API is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

I was here API is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with I was here API.  If not, see <http://www.gnu.org/licenses/>.
*/
// Module dependencies.

// Modules locaux
var geojson = require('./lib/geojson.js');
var fs = require('fs');
var application_root = __dirname,
    gm = require('gm'), // Pour les images...
    express = require('express'); //Web framework

var nano = require('nano')('http://localhost:5984');
var iwashere = require('./lib/iwashere.js');
var dbGeo_name = "apes_iwashere";
var dbGeo = nano.use(dbGeo_name)

/* MongoDB Stuff for storing the pictures */
var mongo = require('mongodb'),
    Db = mongo.Db,
    Grid = mongo.Grid,
    ObjectID = mongo.ObjectID,
    GridStore = mongo.GridStore,
    Step = require('./lib/step.js');

// Open connection to mongodb...
var dbPictures;

Db.connect("mongodb://localhost:27017/apes_iwashere", function (err, db) {
    if (err) return console.dir(err);
    dbPictures = db;
    console.log('connected to mongo db !!! ');
});



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
app.configure(function () {
    //parses request body and populates request.body

    app.use(function (req, res, next) {
        req.rawBody = '';
        req.setEncoding('utf8');

        req.on('data', function (chunk) {
            req.rawBody += chunk;
        });

        next();
    });
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
app.post('/api/iwashere', function (req, res) {
    function savePictureToMongoDB(pictureToSave) {
        // Insert to mongodb the picture !
        // NOTE : WE SAVE THE BASE64 Encoded picture NOT the DECODED ONE !!
        var fileId = new ObjectID();
        var gridStore = new GridStore(dbPictures, fileId, "w", {
            root: 'fs',
            content_type: pictureToSave.split(",")[0]
        });
        gridStore.chunkSize = 1024 * 256;

        gridStore.open(function (err, gridStore) {
            Step(
                function writeData() {
                    var group = this.group();
                    var len = req.rawBody.length;
                    for (var i = 0; i < len; i += 5000) {
                        gridStore.write(pictureToSave.substring(i, i + 5000), group());
                    }
                },

                function doneWithWrite() {
                    gridStore.close(function (err, result) {
                        console.log(fileId);
                        console.log("File has been written to GridFS");
                    });
                }
            )
        });
        return fileId;
    };

    function generateThumbnailToMongoDB(b64picture) {
        var buf = new Buffer(b64picture.split(",")[1], 'base64'); // Picture to generate a thumbnail !
        gm(buf,'jsonImg.jpg')
            .resize(100, 100)
            .toBuffer('JPEG', function (err, buffer) {
                if (err) return handle(err);
                console.log('done encoding the picture !!!!');
            })
    }

    outCorsHeader(req, res);
    var insToDb = req.body;
    /*
    //console.log(req.body);
    var pictureToParse = insToDb.properties.picture.split(",")[1];
    var buf = new Buffer(pictureToParse, 'base64'); // Ta-da
    fs.writeFile("/Users/ddrmanxbxfr/test.jpeg", buf, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });*/
    if (insToDb.properties.picture !== undefined && insToDb.properties.picture !== null) {
        var mongoId = savePictureToMongoDB(insToDb.properties.picture);
        v
        delete insToDb.properties.picture;
        insToDb.properties.pictureid = mongoId;
    }

    dbGeo.insert(insToDb, {}, function (err, body) {
        if (!err) {
            res.send('{"status": "Insert done"}');
        } else {
            res.send('{"status": "Invalid object"}');
        }
    });
});



/**
 * @api {get} /api/iwashere/picture/:id Obtenir une photo selon son mongoID
 * @apiName GetPicture
 * @apiGroup I Was Here
 *
 * @apiParam {Number} id Identifiant unique present dans GridFS MongoDB.
 *
 * @apiSuccess {Jpeg/Base64} photo Photo en format jpeg/base64 !
 *
 *
 */
app.get('/api/iwashere/picture/:id', function (request, response) {
    outCorsHeader(request, response);
    var dataToSend;
    console.log('trying for ' + request.params.id);
    var gridTest = new Grid(dbPictures, 'fs');
    var idToLook = new ObjectID(request.params.id);
    gridTest.get(idToLook, function (err, data) {
        if (!err) {
            response.send(data);
        } else {
            response.send("{status: \'fetch failed\'}");
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
app.get('/api/iwashere/:radius/:lat/:lng', function (request, response) {
    outCorsHeader(request, response);
    dbGeo.list({
        include_docs: true
    }, function (err, doc) {
        var documentToSend;
        if (!err) {

            var documentToWorkOn = geojson.preparerDocumentFeaturesFromCouchView(doc);
            documentToSend = "We worked on it at least";
            if (geojson.evaluerSiTypePoint(documentToWorkOn))
            // "this is really a point document"
                documentToSend = arrondirWpy(request.query.roundloc, iwashere.ajouterProps(geojson.generateGeoJsonDocRadius(documentToWorkOn, request.params.radius, request.params.lat, request.params.lng)));
            else
                documentToSend = "This is not a point document. Can't do anything";
        } else {
            documentToSend = 'could not find id!!';
        }

        response.send(documentToSend);
    });
});

//Start server
var port = 4712;
app.listen(port, function () {
    console.log('Express server listening on port %d in %s mode', port, app.settings.env);
});
