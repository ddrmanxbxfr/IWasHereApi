exports.ajouterProps = function(documentGeoJson) {
    var nombreSansContributions, iCpt, len, newDoc;
    nombreSansContributions = 0;
    len = documentGeoJson.features.length;
    newDoc = {
        name: documentGeoJson.name,
        type: documentGeoJson.type,
        features: [],
        properties: {}
    };
    for (iCpt = 0; iCpt < len; iCpt = iCpt + 1) {
        if (validerTypeContribution(documentGeoJson.features[iCpt])) {
            newDoc.features.push(documentGeoJson.features[iCpt]);
        } else {
            nombreSansContributions = nombreSansContributions + 1;
        }
    }

    newDoc.properties.nbSansContributions = nombreSansContributions;
    return newDoc;
}


function validerTypeContribution(elementAVerifier) {
    if (elementAVerifier.properties.textNote !== undefined) {
        return true;
    } else {
        return false;
    }
}
