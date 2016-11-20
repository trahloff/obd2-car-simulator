var util = require('util');
var math = require('math');
var EventEmitter = require('events');
var Chance = require('chance');
var debug = require('debug');
var log = debug('CarSimulator:log');
var info = debug('CarSimulator:info');
var error = debug('CarSimulator:error');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var gpx2js = require('gpx2js');
var fs = require('fs');
var colors = require('colors');
var gpsutils = require('./gps-utils');
var gpsTimer = 2000;
var timer = 10000;

var mySeed = math.random();
var chance = new Chance(mySeed);

var errorCodes = ["P0001", "P0002", "P0003", "P0004", "P0005", "P0006", "P0007", "P0008", "P0009", "P0010", "P0011", "P0012", "P0013", "P0014", "P0015", "P0016", "P0017", "P0018", "P0019", "P0020", "P0021", "P0022", "P0023", "P0024", "P0025", "P0026", "P0027", "P0028", "P0029", "P0030", "P0031", "P0032", "P0036", "P0037", "P0038", "P0050", "P0051", "P0052", "P0056", "P0057", "P0058", "P0068", "P0075", "P0076", "P0077", "P0078", "P0079", "P0080", "P0081", "P0082", "P0083", "P0084", "P0085", "P0086", "P0087", "P0089", "P0093", "P0100", "P0101", "P0102", "P0103", "P0104", "P0105", "P0106", "P0107", "P0108", "P0110", "P0111", "P0112", "P0113", "P0115", "P0116", "P0117", "P0118", "P0120", "P0121", "P0122", "P0123", "P0125", "P0126", "P0128", "P0130", "P0131", "P0132", "P0133", "P0134", "P0135", "P0136", "P0137", "P0138", "P0139", "P0140", "P0141", "P0142", "P0143", "P0144", "P0146", "P0147", "P0150", "P0151", "P0152", "P0153", "P0154", "P0155", "P0156", "P0157", "P0158", "P0159", "P0160", "P0161", "P0162", "P0163", "P0164", "P0166", "P0167", "P0170", "P0171", "P0172", "P0173", "P0174", "P0175", "P0200", "P0201", "P0202", "P0203", "P0204", "P0205", "P0206", "P0207", "P0208", "P0209", "P0210", "P0211", "P0212", "P0216", "P0217", "P0218", "P0230", "P0231", "P0232", "P0234", "P0235", "P0239", "P0261", "P0262", "P0263", "P0264", "P0265", "P0266", "P0267", "P0268", "P0269", "P0270", "P0271", "P0272", "P0273", "P0274", "P0275", "P0276", "P0277", "P0278", "P0279", "P0280", "P0281", "P0282", "P0283", "P0284", "P0285", "P0286", "P0287", "P0288", "P0289", "P0290", "P0291", "P0292", "P0293", "P0294", "P0295", "P0296", "P0299", "P0300", "P0301", "P0302", "P0303", "P0304", "P0305", "P0306", "P0307", "P0308", "P0309", "P0310", "P0311", "P0312", "P0313", "P0316", "P0325", "P0326", "P0327", "P0328", "P0330", "P0331", "P0332", "P0333", "P0335", "P0336", "P0340", "P0341", "P0342", "P0343", "P0344", "P0345", "P0347", "P0348", "P0349", "P0351", "P0352", "P0353", "P0354", "P0355", "P0356", "P0357", "P0358", "P0359", "P0360", "P0361", "P0362", "P0380", "P0382", "P0385", "P0386", "P0390", "P0400", "P0401", "P0402", "P0403", "P0404", "P0405", "P0406", "P0407", "P0408", "P0409", "P0410", "P0411", "P0412", "P0420", "P0421", "P0422", "P0430", "P0431", "P0432", "P0440", "P0441", "P0442", "P0443", "P0444", "P0445", "P0446", "P0447", "P0448", "P0449", "P0452", "P0453", "P0455", "P0457", "P0463", "P0470", "P0471", "P0472", "P0473", "P0474", "P0480", "P0481", "P0482", "P0489", "P0490", "P0491", "P0492", "P0498", "P0499", "P0500", "P0501", "P0504", "P0505", "P0506", "P0507", "P0510", "P0521", "P0522", "P0527", "P0528", "P0529", "P0545", "P0546", "P0548", "P0549", "P0597", "P0598", "P0599", "P0600", "P0601", "P0603", "P0605", "P0639", "P0650", "P0670", "P0671", "P0672", "P0673", "P0674", "P0675", "P0676", "P0677", "P0678", "P0679", "P0680", "P0681", "P0682", "P0683", "P0684", "P0700", "P0705", "P0720", "P0729", "P0730", "P0731", "P0732", "P0733", "P0734", "P0735", "P0736", "P0740", "P0741", "P0742", "P0743", "P0744", "P0781", "P0782", "P0783", "P0784", "P2002", "P2003", "P2008", "P2011", "P2096", "P2098", "P2135", "P2136", "P2137", "P2138", "P2139", "P2140", "P2181", "P2187", "P2189", "P2195", "P2196", "P2197", "P2198", "P2263", "P2270", "P2272", "P2279", "P2509"];
// OBD-II B Codes for Airbag
var airbagErrorCodes = ["B0020", "B0028", "B0030", "B0038", "B0040", "B0048", "B1900", "B1927"];



var Car = function(deviceId, emitErrors, selectedTrack, airbagChance) {
    // we need to store the reference of `this` to `self`, so that we can use the current context in the setTimeout (or any callback) functions
    // using `this` in the setTimeout functions will refer to those funtions, not the Radio class
    //var self = this;

    console.log("New Simulator for " + deviceId);
    EventEmitter.apply(this);
    // Timer
    this.simulateTimer;

    this.gpx = {};
    this.points = [];
    this.trackNumber = 0;
    this.old_trackNumber;
    this.reverse = false;
    this.currentTrack = "";
    this.emitErrors = emitErrors;
    this.deviceId = deviceId;
    this.isRunning = true;
    this.airbagChance = airbagChance;

    // initialize data
    this.data = {};
    this.data.id = deviceId;
    this.data.vin = "";
    this.data.location = {};
    this.data.pid = {};
    this.data.pid.EXT_BATT_VOLTAGE = {
        unit: "mV"
    };
    this.data.pid.OBD_MILEAGE_METERS = {
        unit: "m"
    };
    this.data.pid.DTC_MIL = {
        unit: "boolean"
    };
    this.data.pid.DTC_NUMBER = {
        unit: "integer"
    };
    this.data.pid.DTC_LIST = {
        unit: "string"
    };
    this.data.pid.OBD_SPEED = {
        unit: "km/h"
    };
    this.data.pid.OBD_FUEL = {
        unit: "litre"
    };
    this.data.pid.DASHBOARD_FUEL_LEVEL = {
        unit: "litre"
    };
    this.data.pid.OBD_RPM = {
        unit: "rpm"
    };
    this.data.pid.OBD_ENGINE_RUNTIME = {
        unit: "seconds"
    };
    this.data.pid.OBD_AMBIENT_AIR_TEMPERATURE = {
        unit: "°C"
    };
    this.data.pid.OBD_ENGINE_COOLANT_TEMPERATURE = {
        unit: "°C"
    };
    this.data.pid.OBD_OUT_TEMPERATURE = {
        unit: "°C"
    };

    this.data.pid.OBD_ENGINE_COOLANT_TEMPERATURE.value = 0;
    this.data.pid.OBD_ENGINE_RUNTIME.value = 0;
    this.data.pid.OBD_RPM.value = 0;
    this.data.pid.OBD_OUT_TEMPERATURE.value = 14.0;
    this.data.pid.OBD_AMBIENT_AIR_TEMPERATURE.value = 12.0;
    this.data.pid.DTC_MIL.value = false;
    this.data.pid.DTC_NUMBER.value = 0;
    this.data.pid.DTC_LIST.value = "";
    this.data.pid.DASHBOARD_FUEL_LEVEL.value = 0;


    this.data.pid.OBD_MILEAGE_METERS.value = chance.integer({
        min: 38000,
        max: 1200000
    })

    this.data.pid.OBD_FUEL.value = chance.floating({
        min: 0.5,
        max: 60,
        fixed: 3
    }) - chance.floating({
        min: 0.010,
        max: 0.100,
        fixed: 3
    });

    this.data.pid.EXT_BATT_VOLTAGE.value = chance.integer({
        min: 11620,
        max: 12410
    });
    this.setTrack(selectedTrack);
};

// call superclass constructor
//Car.prototype = Object.create(EventEmitter.prototype);

util.inherits(Car, EventEmitter);

Car.prototype.generateSpeed = function(gps1, gps2) {
    if (gps1 != null && gps1 != 'undefined' && gps2 != null && gps2 != 'undefined') {
        dist = gpsutils.distance(gps1.lat, gps1.lon, gps2.lat, gps2.lon, "K");
        this.data.pid.OBD_MILEAGE_METERS.value += Math.round(dist * 1000);
        // console.log("DISTANCE: " + dist);
        var distMeters = dist * 1000;
        // console.log("DISTANCE IN METERS: " + distMeters);
        var _speed = dist / (gpsTimer / 1000) * 3600;
        if (_speed > 230.0) {
            _speed = 230.0
        }
        this.data.location.speed = 850 + Math.floor(_speed * 35);
        this.data.pid.OBD_RPM.value = this.data.location.speed;
        this.data.location.speed = _speed;
    }
};

Car.prototype.sendCarInformation = function() {
    this.emit("CarInformation", this.data);
};

Car.prototype.sendTelemetry = function() {
    this.emit("Telemetry", data = {
        "id": this.deviceId,
        "location": this.data.location
    });
};

Car.prototype.triggerAirbag = function() {
    var selectedError = chance.integer({
        min: 0,
        max: airbagErrorCodes.length - 1
    })
    var error = {
        recorded_at: Math.round(new Date().getTime() / 1000),
        error_code: airbagErrorCodes[selectedError]
    }
    this.emit("Airbag", data = {
        "id": this.deviceId,
        "error": error
    });
    return error;
}

Car.prototype.setTrack = function(newTrack) {
    this.currentTrack = newTrack;
    this.old_trackNumber = null;
    this.points = [];
    var self = this;
    if (this.isRunning) {
        this.stopInterval();
        gpx2js.convert(self.currentTrack, function(rv) {
            for (var track in rv.tracks) {
                var segment = rv.tracks[track].segments[0];
                for (var f in segment.points) {
                    if (segment != null && segment != undefined) {
                        if (segment.points[f] != null && segment.points[f] != undefined) {
                            self.points.push(segment.points[f]);
                        }
                    }
                };

            }
            console.log("[INIT]".green + " points.length is " + self.points.length + " in Track " + self.currentTrack);
            self.trackNumber = chance.integer({
                min: 0,
                max: self.points.length - 1
            });
            self.reverse = chance.bool();
            self.startInterval();
        });
    } else {
        gpx2js.convert(self.currentTrack, function(rv) {
            for (var track in rv.tracks) {
                var segment = rv.tracks[track].segments[0];
                for (var f in segment.points) {
                    if (segment != null && segment != undefined) {
                        if (segment.points[f] != null && segment.points[f] != undefined) {
                            self.points.push(segment.points[f]);
                        }
                    }
                };

            }
            console.log("[INIT]".green + " points.length is " + self.points.length + " in Track " + self.currentTrack);
            self.trackNumber = chance.integer({
                min: 0,
                max: self.points.length - 1
            });
            self.reverse = chance.bool();
            console.log("Done converting.");
        });
    }
};

Car.prototype.startInterval = function() {
    var self = this;

    // self.simulateTimer = setInterval(function() {
    self.simulateDataTimer = setInterval(function() {
        if (typeof(self.points) != 'undefined' && self.points != null) {

            if (self.points[self.trackNumber] == null) {
                console.log("ERR: " + self.selectedTrack + " at " + self.trackNumber);
            }
            self.data.location.lat = self.points[self.trackNumber].lat;
            //console.log("Lat: " + self.data.location.lat);
            self.data.location.lon = self.points[self.trackNumber].lon;
            //console.log("Lon: " + self.data.location.lon);
            // self.data.location.alt = points[self.trackNumber].alt;
            self.data.location.dilution = null;
            self.data.pid.OBD_ENGINE_RUNTIME.value += timer;
            self.data.recorded_at = Math.round(new Date().getTime() / 1000);
            self.data.pid.OBD_FUEL.value -= chance.floating({
                min: 0.0001,
                max: 0.002
            });
            if (self.data.pid.OBD_FUEL.value <= 0) {
                self.data.pid.OBD_FUEL.value = chance.floating({
                    min: 0.5,
                    max: 60,
                    fixed: 3
                }) - chance.floating({
                    min: 0.010,
                    max: 0.100,
                    fixed: 3
                });
            }
            self.data.pid.DASHBOARD_FUEL_LEVEL.value = self.data.pid.OBD_FUEL.value - chance.floating({
                min: 0.001,
                max: 1.01
            })
            self.data.pid.OBD_ENGINE_COOLANT_TEMPERATURE.value = chance.floating({
                min: 25.00,
                max: 120.00
            }) + chance.floating({
                min: 0.5,
                max: 10.0,
                fixed: 2
            });
            self.data.pid.OBD_OUT_TEMPERATURE.value += chance.floating({
                min: -0.2,
                max: 0.2
            });
            self.data.pid.OBD_AMBIENT_AIR_TEMPERATURE.value = self.data.pid.OBD_OUT_TEMPERATURE.value - 2;

            if (self.emitErrors == true) {
                self.data.pid.DTC_MIL.value = chance.bool({
                    likelihood: 65
                });
            } else {
                self.data.pid.DTC_MIL.value = false;
            }

            if (self.data.pid.DTC_MIL.value) {
                self.data.pid.DTC_NUMBER.value = chance.integer({
                    min: 1,
                    max: 5
                });
                var numberArray = [];
                var tempCode;
                for (var i = 0; i < self.data.pid.DTC_NUMBER.value; i++) {
                    tempCode = chance.integer({
                        min: 0,
                        max: errorCodes.length
                    })
                    numberArray[i] = errorCodes[tempCode];
                }
                self.data.pid.DTC_LIST.value = numberArray.toString();
            } else {
                self.data.pid.DTC_NUMBER.value = 0;
                self.data.pid.DTC_LIST.value = "null";
            }

        } else {
            console.log("ERROR");
        }
        if (self.airbagChance > 0) {
            var triggerAirbag = chance.bool({
                likelihood: self.airbagChance
            });
            if (triggerAirbag) {
                self.triggerAirbag();
            }
        }

        self.sendCarInformation();
    }, timer);
    self.simulateGpsTimer = setInterval(function() {
        self.data.location.lat = self.points[self.trackNumber].lat;
        self.data.location.lon = self.points[self.trackNumber].lon;
        if (self.reverse != true) {

            info("Timer: sendTelemetryState " + self.trackNumber);
            //console.log("Track " + self.currentTrack + ", max. " + self.points.length + ": " + self.trackNumber + "(old: " + self.old_trackNumber + ")");
            if (self.trackNumber < self.points.length) {
                self.data.location.heading = gpsutils.bearing(self.points[self.trackNumber - 1].lat, self.points[self.trackNumber - 1].lon, self.points[self.trackNumber].lat, self.points[self.trackNumber].lon);

                if (self.trackNumber > 0) {
                    self.generateSpeed(self.points[self.trackNumber - 1], self.points[self.trackNumber]);
                    // sendAirbagStatus(Path.self.data.trackData[self.trackNumber]);
                }
                self.old_trackNumber = self.trackNumber;
                self.trackNumber = self.trackNumber + 1;
                if (self.trackNumber == self.points.length) {
                    self.reverse = true;
                    self.trackNumber = self.trackNumber - 2;
                }
                self.sendTelemetry();
            } else {
                self.trackNumber = 1;

            };
        } else {

            info("Timer: sendTelemetry " + self.trackNumber);
            //console.log("Track " + self.currentTrack + ", max. " + self.points.length + ": " + self.trackNumber + "(old: " + self.old_trackNumber + ")");
            if (self.trackNumber > 1) {
                self.data.location.heading = gpsutils.bearing(self.points[self.trackNumber + 1].lat, self.points[self.trackNumber + 1].lon, self.points[self.trackNumber].lat, self.points[self.trackNumber].lon);

                if (self.trackNumber > 0) {
                    self.generateSpeed(self.points[self.trackNumber + 1], self.points[self.trackNumber]);
                    // sendAirbagStatus(Path.data.trackData[self.trackNumber]);
                }
                self.old_trackNumber = self.trackNumber;
                self.trackNumber = self.trackNumber - 1;
                if (self.trackNumber == -1) {
                    self.reverse = false;
                    self.trackNumber = self.trackNumber + 2;
                }
                self.sendTelemetry();
            } else {
                self.trackNumber = self.points.length - 2;
            }
        };
    }, gpsTimer);
    // });
    this.isRunning = true;
};

// extend the EventEmitter class using our Radio class
//util.inherits(Car, EventEmitter);
Car.prototype.stopInterval = function() {
    clearInterval(this.simulateGpsTimer);
    clearInterval(this.simulateDataTimer);
    // clearInterval(this.simulateTimer);
    this.isRunning = false;
};
// we specify that this module is a refrence to the Radio class
module.exports = Car;
