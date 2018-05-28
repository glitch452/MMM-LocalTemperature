/* global Module */

/**
 * Magic Mirror
 * Module: MMM-LocalTemperature
 *
 * By David Dearden
 * MIT Licensed.
 */
var axis, Log;
/**
 * Register the module with the MagicMirror program
 */
Module.register("MMM-LocalTemperature", {
	
	/**
	 * The default configuration options
	 */
	defaults: {
		sensorPin: null,
		pinScheme: "BCM",
		units: config.units,
		sendTemperature: true,
		sendHumidity: true,
		showTemperature: false,
		showHumidity: false,
		temperatureText: null, // Set in self.start() becuase access to self.translate is needed
		humidityText: null, // Set in self.start() becuase access to self.translate is needed
		decimalSymbol: null, // Set in self.start() becuase access to self.translate is needed
		roundTemperature: false,
		roundHumidity: false,
		scriptPath: null, // Set in self.start() becuase access to self.data.path is needed
		initialLoadDelay: 0, // Seconds, minimum 0
		animationSpeed: 0, // Milliseconds, minimum 0
		retryDelay: 10, // Seconds, minimum 10
		updateInterval: 5, // Minutes, minimum 0.5
		developerMode: false,
	},
	
	/**
	 * The minimum version of magic mirror that is required for this module to run. 
	 */
	requiresVersion: "2.2.1",
	
	/**
	 * Override the start function.  Set some instance variables and validate the selected 
	 * configuration options before loading the rest of the module.  
	 */
	start: function() {
		var self = this;
		self.instanceID = self.identifier + "_" + Math.random().toString().substring(2);
		self.sendSocketNotification("INIT", { instanceID: self.instanceID } );
		self.updateTimer = null;
		self.sensorData = null;
		self.loaded = false;
		self.defaults.scriptPath = self.data.path + "DHT";
		self.defaults.decimalSymbol = self.translate("DECIMAL_SYMBOL");
		self.maxDataAttempts = 3;
		self.validUnits = [ "metric", "imperial", "default" ];
		var unitMap = { "metric": "celcius", "imperial": "fahrenheit", "default": "kelvin" };
		self.validPinSchemes = [ "BOARD", "BCM", "WPI" ];
		self.currentweatherLoaded = false;
		
		var pinMapping = [
			{ "BOARD": 3, "BCM": 2, "WPI": 8 },
			{ "BOARD": 5, "BCM": 3, "WPI": 9 },
			{ "BOARD": 7, "BCM": 4, "WPI": 7 },
			{ "BOARD": 8, "BCM": 14, "WPI": 15 },
			{ "BOARD": 10, "BCM": 15, "WPI": 16 },
			{ "BOARD": 11, "BCM": 17, "WPI": 0 },
			{ "BOARD": 12, "BCM": 18, "WPI": 1 },
			{ "BOARD": 13, "BCM": 27, "WPI": 2 },
			{ "BOARD": 15, "BCM": 22, "WPI": 3 },
			{ "BOARD": 16, "BCM": 23, "WPI": 4 },
			{ "BOARD": 18, "BCM": 24, "WPI": 5 },
			{ "BOARD": 19, "BCM": 10, "WPI": 12 },
			{ "BOARD": 21, "BCM": 9, "WPI": 13 },
			{ "BOARD": 22, "BCM": 25, "WPI": 6 },
			{ "BOARD": 23, "BCM": 11, "WPI": 14 },
			{ "BOARD": 24, "BCM": 8, "WPI": 10 },
			{ "BOARD": 26, "BCM": 7, "WPI": 11 },
			{ "BOARD": 29, "BCM": 5, "WPI": 21 },
			{ "BOARD": 31, "BCM": 6, "WPI": 22 },
			{ "BOARD": 32, "BCM": 12, "WPI": 26 },
			{ "BOARD": 33, "BCM": 13, "WPI": 23 },
			{ "BOARD": 35, "BCM": 19, "WPI": 24 },
			{ "BOARD": 36, "BCM": 16, "WPI": 27 },
			{ "BOARD": 37, "BCM": 26, "WPI": 25 },
			{ "BOARD": 38, "BCM": 20, "WPI": 28 },
			{ "BOARD": 40, "BCM": 21, "WPI": 29 },
		];
		
		// Process and validate configuration options
		if (axis.isNumber(self.config.updateInterval) && self.config.updateInterval >= 0.5) { self.config.updateInterval = self.config.updateInterval * 60 * 1000; }
		else { self.config.updateInterval = self.defaults.updateInterval * 60 * 1000; }
		if (axis.isNumber(self.config.retryDelay) && self.config.retryDelay >= 10) { self.config.retryDelay = self.config.retryDelay * 1000; }
		else { self.config.retryDelay = self.defaults.retryDelay * 1000; }
		if (axis.isNumber(self.config.initialLoadDelay) && self.config.initialLoadDelay >= 0) { self.config.initialLoadDelay = self.config.initialLoadDelay * 1000; }
		else { self.config.initialLoadDelay = self.defaults.initialLoadDelay * 1000; }
		if (!axis.isNumber(self.config.retryDelay) || self.config.retryDelay < 0) { self.config.animationSpeed = self.defaults.animationSpeed; }
		if (!axis.isString(self.config.scriptPath) || self.config.scriptPath.length < 1 ) { self.config.scriptPath = self.defaults.scriptPath; }
		if (!self.validUnits.includes(self.config.units)) { self.config.units = self.defaults.units; }
		self.tempUnit = unitMap[self.config.units];
		if (self.tempUnit === "celcius") {
			self.defaults.temperatureText = self.translate("SHOW_TEMP_CELCIUS", { "temperature_var": "{temperature}" });
		} else if (self.tempUnit === "fahrenheit") {
			self.defaults.temperatureText = self.translate("SHOW_TEMP_FAHRENHEIT", { "temperature_var": "{temperature}" });
		} else {
			self.defaults.temperatureText = self.translate("SHOW_TEMP_KELVIN", { "temperature_var": "{temperature}" });
		}
		self.defaults.humidityText = self.translate("SHOW_HUMIDITY", { "humidity_var": "{humidity}" });
		if (!axis.isString(self.config.temperatureText) || self.config.temperatureText.length < 1 ) { self.config.temperatureText = self.defaults.temperatureText; }
		if (!axis.isString(self.config.humidityText) || self.config.humidityText.length < 1 ) { self.config.humidityText = self.defaults.humidityText; }
		if (!self.validPinSchemes.includes(self.config.pinScheme)) { self.config.pinScheme = self.defaults.pinScheme; }
		if (!axis.isNumber(self.config.sensorPin)) { self.config.sensorPin = self.defaults.sensorPin; }
		if (!axis.isBoolean(self.config.sendTemperature)) { self.config.sendTemperature = self.defaults.sendTemperature; }
		if (!axis.isBoolean(self.config.sendHumidity)) { self.config.sendHumidity = self.defaults.sendHumidity; }
		if (!axis.isBoolean(self.config.roundTemperature)) { self.config.roundTemperature = self.defaults.roundTemperature; }
		if (!axis.isBoolean(self.config.roundHumidity)) { self.config.roundHumidity = self.defaults.roundHumidity; }
		if (!axis.isString(self.config.decimalSymbol)) { self.config.decimalSymbol = self.defaults.decimalSymbol; }
		
		// Validate the provided sensorPin
		var pinObj = pinMapping.find(function(val) { return val[this.scheme] === this.pin; }, { scheme: self.config.pinScheme, pin: self.config.sensorPin });
		if (axis.isUndefined(pinObj)) {
			self.log(self.translate("INVALID_PIN"), { "pinValue": self.config.sensorPin });
			self.config.sensorPin = null;
		} else {
			// Select the WiringPi pin number
			self.config.sensorPin = pinObj.WPI;
		}
		
		self.log(("start(): self.data: " + JSON.stringify(self.data)), "dev");
		self.log(("start(): self.config: " + JSON.stringify(self.config)), "dev");
		
		// Start this module - Request the data from the sensor
		if (!axis.isNull(self.config.sensorPin)) {
			if (self.config.initialLoadDelay > 0) {
				self.log(self.translate("INITIAL_DELAY", { "seconds": (self.config.initialLoadDelay / 1000) }));
				setTimeout(function(){ self.getData(1); self.scheduleUpdate(); }, self.config.initialLoadDelay );
			} else {
				self.getData(1);
				self.scheduleUpdate();
			}
		}
		
	},
	
	/**
	 * Override the suspend function that is called when the module instance is hidden.  
	 * This method stops the update timer.
	 */
	suspend: function() {
        var self = this;
		self.log(self.translate("SUSPENDED") + ".");
		clearInterval(self.updateTimer);
    },
	
	/**
	 * Override the resume function that is called when the module instance is un-hidden.  
	 * This method re-starts the update timer and calls for an update if the update interval
	 * has been passed since the module was suspended. 
	 */
	resume: function() {
        var self = this;
		self.log(self.translate("RESUMED") + ".");
		self.scheduleUpdate();
		var date = new Date();
		var threshold = new Date( self.lastUpdateTime.getTime() + self.config.updateInterval );
		if (date >= threshold) { self.getData(1); }
    },
	
	/**
	 * The scheduleUpdate function starts the auto update timer.  
	 */
	scheduleUpdate: function() {
        var self = this;
        self.updateTimer = setInterval(function() { self.getData(1); }, self.config.updateInterval);
		self.log( self.translate("UPDATE_SCHEDULED", { "minutes": (self.config.updateInterval / (1000 * 60)) }) );
    },
	
	/**
	 * The getData function sends a request to the node helper read the data from the sensor
	 * 
	 * @param attemptNum (number) The number of attempts to read the sensor data
	 */
	getData: function(attemptNum) {
		var self = this;
		self.log(self.translate("DATA_REQUESTED"));
		self.sendSocketNotification("GET_DATA", {
			instanceID: self.instanceID,
			scriptPath: self.config.scriptPath,
			sensorPin: self.config.sensorPin,
			attemptNum: attemptNum,
			notification: "DATA_RECEIVED"
		});
	},
	
	
	/**
	 * Override the socketNotificationReceived function to handle the notifications sent from the node helper
	 * 
	 * @param notification (string) The type of notification sent
	 * @param payload (any) The data sent with the notification
	 */
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		
		// If there is no module ID sent with the notification
		if (!axis.isString(payload.original.instanceID)) {
			if (notification === "LOG") {
				if (payload.translate) { self.log(self.translate(payload.message, payload.translateVars)); }
				else { self.log(payload.message); }
			}
			return;
		}
		
		// Filter out notifications for other instances
		if (payload.original.instanceID !== self.instanceID) {
			self.log(("Notification ignored for ID \"" + payload.original.instanceID + "\"."), "dev");
			return;
		}
		
		if (notification === "LOG") {
			if (payload.translate) { self.log(self.translate(payload.message, payload.translateVars)); }
			else { self.log(payload.message); }
		} else if (notification === "DATA_RECEIVED") {
			if (payload.isSuccessful) {
				self.log(self.translate("DATA_SUCCESS", { "numberOfAttempts": payload.original.attemptNum }));
			self.log(("Sensor Data: " + JSON.stringify(payload.data)), "dev");
				self.sensorData = payload.data;
				self.sendDataNotifications();
				self.loaded = true;
				if (self.data.position) { self.updateDom(self.config.animationSpeed); }
			} else if (payload.original.attemptNum < self.maxDataAttempts) {
				payload.error.stderr = payload.data;
				self.log(self.translate("DATA_FAILURE", { "retryTimeInSeconds": (self.config.retryDelay / 1000) }) + "\n" + JSON.stringify(payload.error));
				setTimeout(function() { self.getData(Number(payload.original.attemptNum) + 1); }, self.config.retryDelay);
			} else {
				self.loaded = true;
				if (self.data.position) { self.updateDom(self.config.animationSpeed); }
			}
		}
	},
	
	/**
	 * Send a notification to all the modules with the temperature and humidity.  
	 * Use the INDOOR_TEMPERATURE and INDOOR_HUMIDITY notification types. 
	 */
	sendDataNotifications: function() {
		var self = this;
		
		if (axis.isNull(self.sensorData)) { return; }
		
		if (self.config.sendTemperature && axis.isNumber(self.sensorData[self.tempUnit])) {
			self.sendNotification("INDOOR_TEMPERATURE", self.sensorData[self.tempUnit]);
		}
		
		if (self.config.sendHumidity && axis.isNumber(self.sensorData.humidity)) {
			self.sendNotification("INDOOR_HUMIDITY", self.sensorData.humidity);
		}
		
	},
	
	/**
	 * Override the notificationReceived function.  
	 * For now, there are no actions based on system or module notifications.  
	 * 
	 * @param notification (string) The type of notification sent
	 * @param payload (any) The data sent with the notification
	 * @param sender (object) The module that the notification originated from
	 */
	notificationReceived: function(notification, payload, sender) {
		var self = this;
		
		if (sender) { // If the notification is coming from another module
			if (notification === "CURRENTWEATHER_DATA") {
				if (!self.currentweatherLoaded) {
					self.currentweatherLoaded = true;
					self.sendDataNotifications();
				}
			}
		} else if (notification === "ALL_MODULES_STARTED") {
			
		}
	},
	
	/**
	 * Override the getDom function to generate the DOM objects to be displayed for this module instance
	 */
	getDom: function() {
		var self = this;
		var wrapper = document.createElement("div");
		wrapper.classList.add("small");
		
		if (self.config.showTemperature || self.config.showHumidity) {
			
			if (!self.loaded) {
				wrapper.classList.add("loading");
				wrapper.classList.add("small");
				wrapper.innerHTML += self.translate("LOADING");
				return wrapper;
			}
			
			var temperatureDecimals = self.config.roundTemperature ? 0 : 1;
			var temperatureValue = self.roundNumber(self.sensorData[self.tempUnit], temperatureDecimals).toFixed(temperatureDecimals);
			temperatureValue = self.replaceAll(temperatureValue.toString(), '.', self.config.decimalSymbol);
			
			var humidityDecimals = self.config.roundHumidity ? 0 : 1;
			var humidityValue = self.roundNumber(self.sensorData.humidity, humidityDecimals).toFixed(humidityDecimals);
			humidityValue = self.replaceAll(humidityValue.toString(), '.', self.config.decimalSymbol);
			
			if (self.config.showTemperature) {
				var temperature = document.createElement("div");
				temperature.innerHTML = self.replaceAll(self.config.temperatureText, '{temperature}', temperatureValue);
				temperature.innerHTML = self.replaceAll(temperature.innerHTML, '{humidity}', humidityValue);
				wrapper.appendChild(temperature);
			}
			
			if (self.config.showHumidity) {
				var humidity = document.createElement("div");
				humidity.innerHTML = self.replaceAll(self.config.humidityText, '{humidity}', self.sensorData.humidity);
				humidity.innerHTML = self.replaceAll(humidity.innerHTML, '{temperature}', humidityValue);
				wrapper.appendChild(humidity);
			}
			
		} else {
			wrapper.style.display = "none";
		}
		
		return wrapper;
	},
	
	/**
	 * The roundNumber function rounds a number to the specified number of decimal places.  
	 * Use a negative precision value to round to a position left of the decimal.  
	 * This function overcomes the floating-point rounding issues and rounds away from 0.  
	 * 
	 * @param number (number) The number to round
	 * @param precision (number) The position to round to before or after the decimal
	 * @return (number) The rounded number
	 */
	roundNumber: function(number, precision) {
        if (precision >= 0) { return Number(Math.round(number + 'e' + precision) + 'e-' + precision); }
    	else { return Number(Math.round(number + 'e-' + Math.abs(precision)) + 'e' + Math.abs(precision)); }
    },
	
	/**
	 * The replaceAll function replaces all occurrences of a string within the given string. 
	 * 
	 * @param str (string) The string to search within
	 * @param find (string) The string to find within str
	 * @param replace (string) The string to use as a replacement for the find string
	 * @return (string) A copy of str with all the find occurrences replaced with replace
	 */
	replaceAll: function(str, find, replace) {
		var output = '';
		var idx = str.indexOf(find);
		while (idx >= 0) {
			output += str.substr(0, idx) + replace;
			str = str.substring(idx + find.length);
			idx = str.indexOf(find);
		}
		output += str;
		return output;
	},
	
	/**
	 * Override the getScripts function to load additional scripts used by this module. 
	 */
	getScripts: function() {
		var scripts = [];
		if (typeof axis !== "function") { scripts.push(this.file("scripts/axis.js")); }
		return scripts;
	},
	
	
	/**
	 * Override the getStyles function to load CSS files used by this module. 
	 */
	getStyles: function () {
		return [
			"MMM-LocalTemperature.css",
			"font-awesome.css",
		];
	},

	
	/**
	 * Override the getTranslations function to load translation files specific to this module. 
	 */
	getTranslations: function() {
		return {
			en: "translations/en.json",
		};
	},
	
	/**
	 * The log function is a convenience alias that sends a message to the console.  
	 * This is an alias for the MagicMirror Log functions with a developer mode feature added.  
	 * This function prepends the module name to the message.  
	 * 
	 * @param message (string) The message to be sent to the console
	 * @param type (string) The type of message (dev, error, info, log)
	 */
	log: function(message, type) {
		var self = this;
		if (self.config.developerMode) {
			var date = new Date();
			var time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
			message = self.name + ": (" + self.data.index + ")(" + time + ") " + message;
		} else { message = self.name + ": " + message; }
		switch (type) {
			case "error": Log.error(message); break;
			case "info": Log.info(message); break;
			case "dev": if (self.config.developerMode) { Log.log(message); } break;
			default: Log.log(message);
		}
	}
	
});
