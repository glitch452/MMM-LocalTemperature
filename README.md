# MMM-LocalTemperature

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) smart mirror project.

This module reads and displays temperature and humidity information from a sensor connected to a Raspberry Pi GPIO pin.  

| Status  | Version | Date       | Maintained? | Minimum MagicMirror² Version |
|:------- |:------- |:---------- |:----------- |:---------------------------- |
| Working | `1.1.0` | 2018-06-05 | Yes         |`2.2.1`                       |

### Example
![Example of MMM-LocalTemperature](images/sample.png?raw=true "Example screenshot")

### Notable Features
1. Get data from a DHT11, DHT22, or AM2302 sensor
2. Display the temperature and/or humidity from this module and/or,
3. Send the temperature and/or humidity to the built in 'currentweather' module via module notifications

### Dependencies
1. A local 'c' program to read the data from the sensor (included)
2. The WiringPi library (Free to install and use)

## Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Copy the module to your computer by executing the following command:<br />`git clone https://github.com/glitch452/MMM-LocalTemperature.git`
3. Install the WiringPi library by executing the following command:<br />`sudo apt-get update && sudo apt-get upgrade && sudo apt-get install build-essential wiringpi`
4. Make sure the `DHT` program that reads the sensor data is executable by executing the following command:<br />`cd MMM-LocalTemperature && chmod +x DHT`

## Using the module

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        ...
        {
            module: "MMM-LocalTemperature",
            position: "top_left", // Only add a position if you want this module to display the data
            header: "Room Temperature",
            config: {
                sensorPin: 22, // For GPIO 22
                ...
                // See below for more Configuration Options
            }
        },
        ...
    ]
}
```

### Configuration Options

| Option                  | Details
|:----------------------- |:-------------
| `sensorPin`             | **REQUIRED** - The GPIO Pin number that is connected to the data pin on the sensor. The default pin scheme is the standard Raspberry Pi (BCM) GPIO numbering system for Rev 2 Pi's. See the `pinScheme` option for other numbering systems.<br />**Type:** `number`
| `pinScheme`             | *Optional* - The pin numbering system to use for the `sensorPin` option. See this [interactive pinout diagram](https://pinout.xyz) for more details on pin usage for the Raspberry Pi. <br />Note: Ultimately the `sensorPin` value will be converted to the WiringPi system, becuase that is the library used by the `DHT` program to interact with the pin. However, any of these numbering systems can be used, since this module will convert the `sensorPin` value automatically based on the selected scheme. <br />**Type:** `string`<br />**Default:** `"BCMv2"`<br />**Options:**<br />- `"BCMv2"` The standard Raspberry Pi GPIO numbering system on current (Rev 2) boards<br />- `"BCMv1"` The standard Raspberry Pi GPIO numbering system on older (Rev 1) boards<br />- `"BOARD"` The physical pin numbering on the GPIO header<br />- `"WPI"` The WiringPi numbering system
| `units`                 | *Optional* - The unit system to use for the temperature value. (`"metric"` = Celcius, `"imperial"` = Fahrenheit, `"default"` = Kelvin)<br />**Type:** `string`<br />**Default:** `config.units`<br />**Options:** `"metric"`, `"imperial"`, `"default"`
| `sendTemperature`       | *Optional* - When `true`, an "INDOOR_TEMPERATURE" notification is sent to the other modules when the data is received from the sensor.  This can be used to display the indoor temperature within the built-in 'currentweather' module. The 'currentweather' module's `showIndoorTemperature` option must be set to `true` for it to display the data sent from this module.<br />**Type:** `boolean`<br />**Default:** `true`
| `sendHumidity`          | *Optional* - When `true`, an "INDOOR_HUMIDITY" notification is sent to the other modules when the data is received from the sensor.  This can be used to display the indoor humidity within the built-in 'currentweather' module. The 'currentweather' module's `showIndoorHumidity` option must be set to `true` for it to display the data sent from this module.<br />**Type:** `boolean`<br />**Default:** `true`
| `showTemperature`       | *Optional* - When `true`, the module will display the temperature on screen.<br />**Type:** `boolean`<br />**Default:** `false`
| `showHumidity`          | *Optional* - When `true`, the module will display the humidity on screen.<br />**Type:** `boolean`<br />**Default:** `false`
| `iconView`              | *Optional* - When `true`, a view which uses icons and the data will be shown instead of the standard temperature and humidity text. The data shown depends on the `showTemperature` and `showHumidity` options. <br />**Type:** `boolean`<br />**Default:** `true`
| `temperatureText`       | *Optional* - The text template to be used when displaying the temperature data. The stings `"{temperature}"` and `"{humidity}"` will be replaced with the temperature and humidity values respectively. <br />**Type:** `string`<br />**Default:** `"Temperature: {temperature}°C/°F/K"`
| `humidityText`          | *Optional* - The text template to be used when displaying the humidity data. The stings `"{temperature}"` and `"{humidity}"` will be replaced with the temperature and humidity values respectively. <br />**Type:** `string`<br />**Default:** `"Humidity: {humidity}%"`
| `fontSize`              | *Optional* - The main font size to use for the module text. <br />**Type:** `string`<br />**Default:** `'medium'`<br />**Options:** `'x-small'`, `'small'`, `'medium'`, `'large'`, `'x-large'`
| `decimalSymbol`         | *Optional* - The character to use as the decimal symbol. <br />**Type:** `string`<br />**Default:** `"."`
| `roundTemperature`      | *Optional* - When true, the temperature value will be rounded to the nearest integer. <br />**Type:** `boolean`<br />**Default:** `false`
| `roundHumidity`         | *Optional* - When true, the humidity value will be rounded to the nearest integer. <br />**Type:** `boolean`<br />**Default:** `false`
| `scriptPath`            | *Optional* - The location of the `DHT` program. This is the fully qualified path including the program file name. <br />**Type:** `string`<br />**Default:** `<module_folder_path>\DHT`
| `updateInterval`        | *Optional* - The number of minutes to wait before requesting an update of the data from the sensor. The minimum value is `0.5`. <br />**Type:** `number`<br />**Default:** `5`
| `retryDelay`            | *Optional* - The number of seconds to wait before trying to request the sensor data after a sensor read failure. The minimum value is `10`. Since the reading of the data from the sensor is time sensitive, and can be interrupted by context switching, the `DHT` program is told to try up to 3 times.  This option is the amount of time for this module to wait before the next 3 tries. <br />**Type:** `number`<br />**Default:** `10`
| `initialLoadDelay`      | *Optional* - The number of seconds to wait before starting to run this module. The minimum value is `0`. <br />**Type:** `number`<br />**Default:** `0`
| `animationSpeed`        | *Optional* - The number of milliseconds to use for the animation when updating the on-screen display of this module. The minimum value is `0`.<br />**Type:** `number`<br />**Default:** `0`

## Connecting the Sensor to the Raspberry Pi

Here are some diagrams that you may find useful when connecting your sensor.  See the [guide from adafruit.com](docs/adafruit-dht-sensor-guide.pdf?raw=true) for more wiring and programming information.

### DHT11 sensor
![Example of a DHT11 sensor with a Raspberry Pi](images/wiring_dht11.png?raw=true "How to connect a DHT11 sensor to a Raspberry Pi")

### DHT22 / AM2302 sensor
![Example of a DHT22 / AM2302 sensor with a Raspberry Pi](images/wiring_dht22.png?raw=true "How to connect a DHT22 sensor to a Raspberry Pi")

### AM2302 sensor with wires
![Example of a AM2302 sensor with a Raspberry Pi](images/wiring_am2302.png?raw=true "How to connect a AM2302 sensor to a Raspberry Pi")

## Customizing the DHT Program

The `DHT` program is a `c` coded program used to read the sensor data. A `c` program is required to read the sensor data because the data is transmitted by extremely short pulses of signal and the `c` code executes much faster than python.

The included `DHT` program is something I pieced together based on code from [dht22 by nebulx29](https://github.com/nebulx29/dht22) and the [Python DHT Sensor Library by Adafruit](https://github.com/adafruit/Adafruit_Python_DHT).

If you would like to customize the `DHT` program, you can edit the file `DHT.c` with your favorite editor, then re-compile it using the following command: `cc -Wall DHT.c -o DHT -lwiringPi`

## Updates
To update the module to the latest version, use your terminal to:
1. Navigate to your MMM-LocalTemperature folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules/MMM-LocalTemperature`
2. Update the module by executing the following command:<br />`git pull`

If you have changed the module on your own, the update will fail. <br />To force an update (WARNING! your changes will be lost), reset the module and then update with the following commands:
```
git reset --hard
git pull
```

## License

### The MIT License (MIT)

Copyright © 2018 David Dearden

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the “Software”), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

**The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.**