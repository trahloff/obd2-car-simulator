var express = require('express');
var bodyParser = require('body-parser');
var SimulatorManager = require('./lib/simulatorManager.js');
var cfenv = require('cfenv');
var busboy = require('connect-busboy');

var simManager = new SimulatorManager();
simManager.start();


//==============================================================================

// setup server for webUI
//==============================================================================
// create server
var server = express();

// Set the format for input
server.use(bodyParser.urlencoded({
    extended: false
}));
server.use(bodyParser.json());

// Set CORS Headers
// server.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

// setup routes for configuration
var router = express.Router();

// List of car manufacturers and models
var avaibleCars = {
    manufacturers: [{
        manufacturer: "BMW",
        models: [
            "3er",
            "7er",
            "M6",
            "Z4"
        ]
    }]
};

// /simulatedDevices is used for modifying the list of simulated devices
router.route('/simulatedDevices')
    // get a list of all simulated Cars with selected Tracks
    .get(function(req, res) {
        var type = 'User-Simulated-Car';
        dbLayer.getUserSimulatedCars(type, function(err, simulated_cars) {
            if (err) {
                console.log("Error on reading simulated_cars.json");
                console.log(err);
                res.status(500).send("No Information available");
            } else {
                console.log("GET on /simulatedDevices");
                res.json({
                    simulated_cars: simulated_cars
                });
            }
        });
    })
    // add a simulated Car
    .post(function(req, res) {
        var track = req.body.track;
        var airbagChance = req.body.airbagChance;
        if (track == null) {
            fs.readdir('./tracks', function(err, tracks) {
                if (err) {
                    console.log(err);
                    track = "null";
                } else {
                    var selectedTrack = chance.integer({
                        min: 0,
                        max: tracks.length - 1
                    });
                    track = tracks[selectedTrack];
                }
            });
        }
        if (airbagChance == null) {
            airbagChance = 0;
        }
        if (airbagChance > 100) {
            airbagChance = 100;
        }
        var type = "User-Simulated-Car";
        var deviceId = uuid.v4();
        var authToken = 'UserSimulatedCar1234';
        var serialNumber = uuid.v4();
        var selectedManufactrurer = chance.integer({
            min: 0,
            max: avaibleCars.manufacturers.length - 1
        })
        var manufacturer = avaibleCars.manufacturers[selectedManufactrurer].manufacturer;
        var selectedModel = chance.integer({
            min: 0,
            max: avaibleCars.manufacturers[selectedManufactrurer].models.length - 1
        })
        var model = avaibleCars.manufacturers[selectedManufactrurer].models[selectedModel];
        var fwVersion = "1.0.0";
        var hwVersion = "1.0.0";
        var devInfo = {
            "serialNumber": serialNumber,
            "manufacturer": manufacturer,
            "model": model,
            "fwVersion": fwVersion,
            "hwVersion": hwVersion
        };
        console.log("register new device " + deviceId);
        appClient.registerDevice(type, deviceId, authToken, devInfo, null, null).then(function onSuccess(response) {
                dbLayer.addUserSimulatedCar(deviceId, type, track, airbagChance, function(success) {
                    if (success) {
                        addSimulator(deviceId, type, track, airbagChance);
                        res.json({
                            message: "success",
                            "deviceId": deviceId,
                            "track": track,
                            "authToken": authToken,
                            "devInfo": devInfo
                        });
                    } else {
                        res.status(500).json({
                            message: "Could not create Car"
                        });
                    }
                });
            },
            function onError(err) {
                if (err.data != null && err.data.exception.id == "CUDRS0020E") {
                    res.status(500).send("The deviceID already exists");
                } else {
                    console.log("Failed to register Device");
                    console.log(err);
                    res.status(500).send("Failed to create Car");
                };
            });
    });

// access to single Devices for modification
router.route('/simulatedDevices/:deviceId')
    // get a single Car
    .get(function(req, res) {
        var deviceId = req.params.deviceId;
        var type = 'User-Simulated-Car';
        appClient.getDevice(type, deviceId).then(function onSuccess(response) {
            dbLayer.getUserSimulatedCar(deviceId, type, function(err, device) {
                if (err) {
                    console.log("Could not get Device: " + deviceId);
                    console.log(err);
                    res.status(500).json({
                        message: "Failed to get device Information"
                    });
                } else {
                    var isRunning = userSimulators.get(deviceId).isRunning;
                    res.json({
                        message: "Success",
                        device: response,
                        isRunning: isRunning,
                        track: device.track,
                        airbagChance: device.airbagChance
                    });
                }
            });
        }, function onError(err) {
            console.log("Could not get Device: " + deviceId);
            console.log(err);
            res.status(500).json({
                message: "Failed to get device Information"
            });
        });
    })
    // delete a Car
    .delete(function(req, res) {
        var type = 'User-Simulated-Car';
        var deviceId = req.params.deviceId;
        console.log("delete device " + deviceId);
        appClient.unregisterDevice(type, deviceId).then(function onSuccess(response) {
            if (userSimulators.has(deviceId)) {
                dbLayer.deleteUserSimulatedCar(deviceId, function(success) {
                    if (success) {
                        userSimulators.get(deviceId).stopInterval();
                        userSimulators.remove(deviceId);
                        res.json({
                            message: "success"
                        });
                    } else {
                        res.status(500).json({
                            message: "Could not delete Car"
                        });
                    }
                });
            }
        }, function onError(err) {
            console.log("Failed to delete device " + deviceId);
            console.log(err);
            res.status(500).json({
                message: "Could not delete Car"
            });
        });
    })
    // change the track of a car
    .put(function(req, res) {
        var newTrack = req.body.newTrack;
        var deviceId = req.params.deviceId;
        var type = "User-Simulated-Car";
        if (newTrack != null) {
            dbLayer.changeTrackOfUserSimulatedCar(deviceId, newTrack, function(success) {
                if (success) {
                    userSimulators.get(deviceId).setTrack('./tracks/' + newTrack);
                    res.json({
                        message: "success"
                    });
                } else {
                    res.status(500).json({
                        message: "Could not change Track"
                    });
                }
            })
        } else {
            res.status(500).send("No track given");
        }
    });

// start/stop devices
router.route('/simulatedDevicesCommand/:deviceId')
    .put(function(req, res) {
        var command = req.body.command;
        var deviceId = req.params.deviceId;
        if (command == "start") {
            if (!userSimulators.get(deviceId).isRunning) {
                userSimulators.get(deviceId).startInterval();
                res.json({
                    message: "success"
                });
            } else {
                res.status(500).send("The device is already running")
            }
        } else if (command == "stop") {
            if (userSimulators.get(deviceId).isRunning) {
                userSimulators.get(deviceId).stopInterval();
                res.json({
                    message: "success"
                });
            } else {
                res.status(500).send("The device is not running")
            }
        } else {
            res.status(500).send("Unrecognized command " + command);
        }
    });

router.route('/triggerAirbag/:deviceId')
    .put(function(req, res) {
        var deviceId = req.params.deviceId;
        var error = userSimulators.get(deviceId).triggerAirbag();
        res.json({
            message: "success",
            error: error
        });
    })

// used to administrate tracks
router.route('/tracks')
    // provides a list off all tracks
    .get(function(req, res) {
        fs.readdir('./tracks', function(err, tracks) {
            if (err) {
                console.log(err);
                res.status(500).send("Could not load tracks");
            } else {
                res.json({
                    "tracks": tracks
                });
            }
        });

    });

// bind routes to /simulator
server.use('/simulator', router);

// get the application enviroment with cfenv
var appEnv = cfenv.getAppEnv();

var port = appEnv.port || 7777;

// start server on the specified port and binding host
server.listen(port, '0.0.0.0', function() {

    // print a message when the server starts listening
    console.log("[INIT]".green + " server starting on " + appEnv.url);

});
//==============================================================================
