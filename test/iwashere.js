var iwashere = require('./../lib/iwashere.js');
var should = require('should');

describe('Verifier les contributions des utilisateurs', function () {
    var itShouldHave1UserContribution, itShouldHave0Contribution;
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


        done();
    });

    it('should have 0 contributions', function () {
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
});
