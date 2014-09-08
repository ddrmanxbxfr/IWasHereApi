var iwashere = require('./../lib/iwashere.js');
var should = require('should');

describe('Verifier les contributions des utilisateurs', function () {
    var itShouldHave1UserContribution, itShouldHave0Contribution, itShouldHaveOneFeatures;
    before(function (done) {
        var mockDataEmpty = {
            features: [
                {
                    properties: {
                        geoAccuracy: 2222
                    }
                }
            ]
        };

        itShouldHave1UserContribution = iwashere.ajouterProps(mockDataEmpty);

        itShouldHave0Contribution = iwashere.ajouterProps({});

        mockDataEmpty = {
            features: [
                {
                    properties: {
                        textNote: "yolo"
                    }
                }
            ]
        };

        itShouldHaveOneFeatures = iwashere.ajouterProps(mockDataEmpty);

        done();
    });

    it('should have 0 contributions even with empty json object', function () {
        itShouldHave0Contribution.name.should.be.exactly("ParkingAPI").and.be.a.String;
        itShouldHave0Contribution.type.should.be.exactly("FeaturesCollection").and.be.a.String;
        itShouldHave0Contribution.features.length.should.be.exactly(0).and.be.a.Number;
        itShouldHave0Contribution.properties.nbSansContributions.should.be.exactly(0).and.be.a.Number;
    });

    it('should have 1 user contribution', function () {
        itShouldHave1UserContribution.name.should.be.exactly("ParkingAPI").and.be.a.String;
        itShouldHave1UserContribution.type.should.be.exactly("FeaturesCollection").and.be.a.String;
        itShouldHave1UserContribution.features.length.should.be.exactly(0).and.be.a.Number;
        itShouldHave1UserContribution.properties.nbSansContributions.should.be.exactly(1).and.be.a.Number;
    });

        it('should have 1 features with textProp', function () {
        itShouldHaveOneFeatures.name.should.be.exactly("ParkingAPI").and.be.a.String;
        itShouldHaveOneFeatures.type.should.be.exactly("FeaturesCollection").and.be.a.String;
        itShouldHaveOneFeatures.features.length.should.be.exactly(1).and.be.a.Number;
        itShouldHaveOneFeatures.features[0].properties.textNote.should.be.exactly("yolo").and.be.a.String;
        itShouldHaveOneFeatures.properties.nbSansContributions.should.be.exactly(0).and.be.a.Number;
    });
});
