var jwt = require('jwt-simple');
var crypto = require('crypto');


// Connection à la BD
var nano = require('nano')('http://localhost:5984');
var authBDName = "api_users"
var authDB = nano.use(authBDName);

function encoderToken(pLogin, secret, response)
{
  var token = jwt.encode({ username: pLogin}, secret);
  return {token: token};
}

function validerUser(pLogin, pPwd, response){
  authDB.view('nodejs', 'password', {
    keys: [pLogin]
  }, function(err, doc) {
    var documentToSend;
    if (!err) {
      if (doc.rows[0].value.password === pPwd)
        var tok = encoderToken(pLogin, doc.rows[0].value.secret)
        response.json(tok);
    } else {
      response.send({result: "AuthError"});
    }
      response.send({result: "AuthError"});
  })
}

function validerStructureJsonUser(pJSON) {
  if (pJSON.hasOwnProperty('username') &&
    pJSON.hasOwnProperty('password') &&
    pJSON.hasOwnProperty('email'))
    return true;
  else
    return false;
}

function ecrireBDUser(pJson, response) {
  // Do the insert dude !
  authDB.insert(pJson, function(err, body) {
    if (!err)
      response.send({result: "RegisterSuccess"});
    else
      response.send({result: "InsertError"});
  });
}


function genererSecretPourToken() {
  // Pour l'instant retourne un hash sha1
  var current_date = (new Date()).valueOf().toString();
  var random = Math.random().toString();
  var shasum = crypto.createHash('sha1').update(current_date + random).digest('hex');
  return shasum;
}

exports.fournirTokenLogin = function(pLogin, pPwd, response){
  validerUser(pLogin, pPwd,response);
}

exports.validerToken = function(pToken, response){
  // Générer le token et le comparer a celui du client...
  authDB.view('nodejs', 'password', {
    keys: [pLogin]
  }, function(err, doc) {
    var documentToSend;
    if (!err) {
      if (doc.rows[0].value.password === pPwd)
        var tok = encoderToken(pLogin, doc.rows[0].value.secret)
        if (tok === pToken)
          response.json(tok);
        else
          response.send({result: "TokenError"})
    } else {
      response.send({result: "AuthError"});
    }
      response.send({result: "AuthError"});
  })
}

exports.ajouterUser = function (pJson, response){
  if (validerStructureJsonUser(pJson))
    {
    pJson.secret = genererSecretPourToken();
    ecrireBDUser(pJson,response);
    }
  else
    response.send({result: "JSONNotValidError"});
}
