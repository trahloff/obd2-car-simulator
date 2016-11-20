# obd2-car-simulator
An application which simulates the output of an OBD2 port and publishes the information to the IBM Watson IoT Platform.

Upon start it will check for a DeviceType "Simulated-Car" and if there are at least 5 Devices of that type. If not it will create them.
Afterwards it will start omitting OBD2 and GPS data for all Devices of type "Simulated-Car".
