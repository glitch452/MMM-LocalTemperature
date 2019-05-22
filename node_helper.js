/**
 * Magic Mirror
 * Node Helper: MMM-LocalTemperature
 *
 * By David Dearden
 * MIT Licensed.
 */

/**
 * Load resources required by this module.  
 */
var NodeHelper = require("node_helper");
const exec = require("child_process").exec;

/**
 * Use NodeHelper to create a module.  
 */
module.exports = NodeHelper.create({
	
	/**
	 * The minimum version of magic mirror that is required for this module to run. 
	 */
	requiresVersion: "2.2.1",
	
	/**
	 * Override the start function to run when the module is started up.  
	 * Used to provide initialization information to the console.
	 */
	start: function () {
		var self = this;
		console.log(self.name + ": module loaded! Path: " + this.path);
	},
	
	/**
	 * Override the socketNotificationReceived function to handle notifications sent from the client script. 
	 * 
	 * @param notification (string) The type of notification sent
	 * @param payload (any) The data sent with the notification
	 */
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (payload.developerMode) { console.log(self.name + ': Socket Notification Received: "' + notification + '".'); }
		if (notification === "GET_DATA") {
			self.getSensorData(payload);
		} else if (notification === "INIT") {
			self.sendSocketNotification("LOG", { original: payload, message: ("INIT received from: " + payload.instanceID + "."), messageType: "dev" } );
			self.sendSocketNotification("LOG", { original: payload, message: ("node_helper.js loaded successfully."), messageType: "dev" } );
		}
	},
	
	/**
	 * The getSensorData queries the sensor for data usin the provided script
	 * 
	 * @param payload (object) Contains the data required for querying the sensor
	 */
	getSensorData: function(payload) {
		var self = this;
		exec("sudo " + payload.scriptPath + " " + payload.sensorPin + " -m j -a 3", {}, function(error, stdout, stderr){
			var result;
			if (!error) {
				result = { original: payload, isSuccessful: true, data: JSON.parse(stdout) };
			} else {
				result = { original: payload, isSuccessful: false, data: stderr, error: error };
			}
			if (typeof payload.notification === "string") { self.sendSocketNotification(payload.notification, result); }
		});
	},
	
});
