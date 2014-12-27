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

exports.ajouterProps = function (documentGeoJson) {
    var nombreSansContributions, iCpt, len, newDoc;
    nombreSansContributions = 0;
    if (documentGeoJson.name === undefined || documentGeoJson.type === undefined) {
        newDoc = {
            name: "ParkingAPI",
            type: "FeaturesCollection",
            features: [],
            properties: {}
        };

    } else {
        newDoc = {
            name: documentGeoJson.name,
            type: documentGeoJson.type,
            features: [],
            properties: {}
        };
    }

    if (documentGeoJson.features !== undefined  && documentGeoJson.features.length !== undefined && documentGeoJson.features.length > 0) {
        len = documentGeoJson.features.length;
        for (iCpt = 0; iCpt < len; iCpt = iCpt + 1) {
            if (validerTypeContribution(documentGeoJson.features[iCpt])) {
                newDoc.features.push(documentGeoJson.features[iCpt]);
            } else {
                nombreSansContributions = nombreSansContributions + 1;
            }
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
