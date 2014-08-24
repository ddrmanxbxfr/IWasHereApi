var calculs = require('./calculs.js');

var filterWpyOutOfBounds = function(documentSrc, latSW, lngSW, latNE, lngNE) {
  var docReturn = [];
  // Calculer le point central
  var pointCalc = calculs.calculerPointCentreRectangle(latSW, latNE, lngSW, lngNE);
  var radiusTarget = calculs.calcDistance(pointCalc.lat, pointCalc.lng, latNE, lngNE);

  for (var iCpt = 0; iCpt <  documentSrc.length; iCpt++) {
    if (calculs.isPointInRadius(radiusTarget,
      pointCalc.lat,
      pointCalc.lng,
      documentSrc[iCpt].lat,
      documentSrc[iCpt].lng))
      docReturn.push(documentSrc[iCpt]);
  }
  return docReturn;
}

var genGeoJsonFeatureFromWpy = function(wpyToConvert) {
  var docFeature = {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [
        wpyToConvert.lng,
        wpyToConvert.lat
      ]
    },
    "properties": {
      "TITRE": wpyToConvert.titre,
      "TYPE": wpyToConvert.type,
      "DESCRIPTION": wpyToConvert.description,
      "STATUS": wpyToConvert.status,
    }
  };

  return docFeature;
}

var genGeoJsonFromWpyList = function(wpyList) {
  var docToReturn = {
    "name": "BONCITOYEN",
    "type": "FeatureCollection",
    "features": []
  };

  for (var iCpt = 0; iCpt <  wpyList.length; iCpt++) {
    docToReturn.features.push(genGeoJsonFeatureFromWpy(wpyList[iCpt]));
  }

  return docToReturn;
}

exports.validerStatus = function(statusAValider) {
  //Note workflow : 0 résolu, 1 déclaré, 2 en cours.
  if (statusAValider === 0 || statusAValider === 1 || statusAValider === 2)
    return true;
  else
    return false;
}

// Un citoyen doit avoir au moin, titre, type, location et description.
exports.validerStructureJsonBonCitoyen = function (documentAValider) {
  if (documentAValider.hasOwnProperty('titre') &&
    documentAValider.hasOwnProperty('type') &&
    documentAValider.hasOwnProperty('lat') &&
    documentAValider.hasOwnProperty('lng') &&
    documentAValider.hasOwnProperty('description'))
    return true;
  else
    return false;
}

exports.genGeoJsonFilterBounds = function(documentSrc, latSW, lngSW, latNE, lngNE) {
  // Filter the docs !
  var filteredDoc = filterWpyOutOfBounds(documentSrc, latSW, lngSW, latNE, lngNE);
  // Generate geoJson from wpys in database !!!
  var geoJsonCollection = genGeoJsonFromWpyList(filteredDoc);

  return geoJsonCollection;
}
