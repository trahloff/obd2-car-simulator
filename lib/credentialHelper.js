var fallback = require("../credentials/vcap.json");
var VCAP_SERVICES = process.env.VCAP_SERVICES;

function credentialHelper() {};

credentialHelper.prototype.getVCAP = function () {
  var vcap = VCAP_SERVICES == null ? fallback.VCAP_SERVICES : VCAP_SERVICES;
  try {
      vcap = JSON.parse(vcap);
  } catch (e) {
      console.log("You're working in a local DevEnv");
  }
  return vcap;
};

module.exports = credentialHelper;