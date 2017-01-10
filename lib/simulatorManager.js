var Simulator = require('./carSimulator.js');
var math = require("math");
var Chance = require('chance');
var HashMap = require('hashmap');
var fs = require('fs');
var mySeed = math.random();
var chance = new Chance(mySeed);
var Client = require("ibmiotf");
var uuid = require('node-uuid');

var deviceType = "Simulated-Car";
var userSimulators = new HashMap();
var connected;
var self;

var SimulatorManager = function(appClientConfig, numberOfSimulatedCars){
 self = this;
 self.appClient = new Client.IotfApplication(appClientConfig);
 if(numberOfSimulatedCars != null && numberOfSimulatedCars != "undefined"){
   self.numberOfSimulatedCars = numberOfSimulatedCars;
 } else {
   self.numberOfSimulatedCars = 5;
 }
};

SimulatorManager.prototype.start = function(){
  console.log("Starting SimulatorManager");
  connected = 0;
  // handle the connection
  self.appClient.on("connect", function() {
      connected++;
      if (connected == 1) {
          console.log("[INIT]".green + " appClient is connected");
          self.doesDeviceTypeExist(function onSuccess(err, response){
            self.doDevicesExist(function onSuccess(err,response){
              self.simulateDevices();
            });
          });
      }
  });

  // handle errors
  self.appClient.on("error", function(err) {
      console.log("An unexpected error occured on appClient");
      console.log(err);
  });
  self.appClient.connect();
};



SimulatorManager.prototype.doDevicesExist = function(callback){
  self.appClient.listAllDevicesOfType(deviceType).then(function onSuccess(response) {
        if(response.results.length < self.numberOfSimulatedCars){
          console.log("Not enough devices existing");
          for (i = 0; i < self.numberOfSimulatedCars; i++) {
              self.createDevice()
          }
          if(callback !== null && callback != 'undefined'){
            callback();
          }
        } else {
          if(callback !== null && callback != 'undefined'){
            callback();
          }
        }
      },
      function onError(err) {
          console.log("Could not retrieve Devices");
          console.log(err);
          callback(err);
      });
};

SimulatorManager.prototype.doesDeviceTypeExist = function(callback){
    self.appClient.getDeviceType(deviceType).then(function onSucess(response){
      callback();
    },
    function onError(err){
        if(err.status === 404){
          console.log("DeviceType '" + deviceType + "' does not exist.");
          self.createDeviceType(callback);
        } else {
          console.console.error("Unknown error: " + JSON.stringify(err));
          callback(err);
        }
    });
};

SimulatorManager.prototype.createDeviceType = function(callback){
    console.log("Creating DeviceType '" + deviceType + "'");
    self.appClient.registerDeviceType(deviceType,"Simulated Car omitting OBD2 data.",null,null).then (function onSuccess (argument) {
            console.log("Success");
            console.log(argument);
            for (i = 0; i < 5; i++) {
                self.createDevice()
            }
            callback(null, argument);
    }, function onError (argument) {
            console.log("Fail");
            console.log(argument);
            callback(argument, null);
    });
};

SimulatorManager.prototype.createDevice = function(callback){
    console.log("Creating Device '" + deviceType + "'");
    self.appClient.registerDevice(deviceType, uuid.v4(), deviceType, null, null, null).then (function onSuccess (response) {
            console.log("Success");
            console.log(response);
            if(callback !== null && callback != 'undefined'){
              callback();
            }
    }, function onError (error) {
            console.log("Fail");
            console.log(error);
            if(callback !== null && callback != 'undefined'){
              callback();
            }
    });
};

SimulatorManager.prototype.addSimulator = function(deviceId, type, track, airbagChance) {
    userSimulators.set(deviceId, new Simulator(deviceId, false, './tracks/' + track, airbagChance));
    userSimulators.get(deviceId).on('CarInformation', function(data) {
        if (self.appClient.isConnected) {
            self.appClient.publishDeviceEvent(type, deviceId, "CarInformation", "json", JSON.stringify(data));
            console.log("[" + deviceId + "] CarInformation emitted.");
        }
    });
    userSimulators.get(deviceId).on('Airbag', function(data) {
        if (self.appClient.isConnected) {
            self.appClient.publishDeviceEvent(type, deviceId, "Airbag", "json", JSON.stringify(data));
            console.log("[" + deviceId + "] Airbag data emitted.");
        }
    });
    userSimulators.get(deviceId).on('Telemetry', function(data) {
        if (self.appClient.isConnected) {
            self.appClient.publishDeviceEvent(type, deviceId, "Telemetry", "json", JSON.stringify(data));
            var location = {
                latitude: data.lat,
                longitude: data.lon,
                accuracy: (data.dilution != null) ? data.dilution : 0,
                elevation: 0
            };
            self.appClient.updateDeviceLocation(type, deviceId, location, data.recorded_at).then(function onSuccess(response) {
                // no action needed
            }, function onError(response) {
                // hope for next try to succeed
            });
            console.log("[" + deviceId + "] Telemetry data emitted.");
        }
    });
};

// Simulate all devices of type 'Simulated-Car'
SimulatorManager.prototype.simulateDevices = function() {
    console.log("Begin loading up devices of type '"+ deviceType + "'".yellow);

    // get a list of all devices of the type 'Simulated-Car' on the platform
    self.appClient.listAllDevicesOfType(deviceType).then(function onSuccess(response) {
            if (response.results != null) {
                // select a random track
                fs.readdir('./tracks', function(err, tracks) {
                    if (err) {
                        console.log(err);
                    } else {
                        // Iterate over devices and apply the simulator
                        var i = 0;
                        response.results.forEach(function(dev) {
                            if(i < self.numberOfSimulatedCars){
                              var selectedTrack = chance.integer({
                                  min: 0,
                                  max: tracks.length - 1
                                });
                                var track = tracks[selectedTrack];
                                self.addSimulator(dev.deviceId, deviceType, track, 0);
                                i++;
                              }
                        });
                    }
                });
            }
            console.log("Finished loading up devices of type 'Simulated-Car'".yellow);
        },
        function onError(err) {
            console.log("Could not retrieve Devices");
            console.log(err);
        });
};

module.exports = SimulatorManager;
