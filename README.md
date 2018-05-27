# MMM-LocalTemperature

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) smart mirror project.

This module reads and displays temperature and humidity information from a sensor connected to a Raspberry Pi GPIO pin.  

| Status  | Version | Date       | Maintained? | Minimum MagicMirror² Version |
|:------- |:------- |:---------- |:----------- |:---------------------------- |
| Beta Testing | `0.1.0` | 2018-05-27 | Yes         |`2.2.1`                       |

### Example
![Example of MMM-LocalTemperature](images/sample.png?raw=true "Example screenshot")

### Notable Features
1. Get data from a DHT11, DHT22, or AM2302 sensor (The DHT11 sensor is untested as I don't have one to test with)
2. Display the temperature and/or humidity from this module and/or,
3. Send the temperature and/or humidity to the built in 'currentweather' module via notifications

### Dependencies
1. A local 'c' program to read the data from the sensor (included)
2. The WiringPi library (Free to install and use)

## Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Copy the module to your computer by executing the following command:<br />`git clone https://github.com/glitch452/MMM-LocalTemperature.git`
3. Make the 'c' program that reads the sensor data executable by executing the following command:<br />`cd MMM-LocalTemperature && chmod +x dht`
4. Install the WiringPi library by executing the following command:<br />`sudo apt-get update && sudo apt-get upgrade && sudo apt-get install build-essential wiringpi`

## Using the module

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        ...
        {
            module: "MMM-LocalTemperature",
            //position: "top_left", // Add a position if you want this module to display the data
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
| `sensorPin`             | **REQUIRED** - The GPIO Pin number that is connected to the data pin on the sensor. The default pin scheme is the standard Raspberry Pi (BCM) GPIO numbering system. See the `pinScheme` option for other numbering systems.<br />**Type:** `number`<br />**Default:** `N/A`<br />
| `pinScheme`             | *Optional* - The pin numbering system to use for the `sensorPin` option. See this [interactive pinout diagram](https://pinout.xyz) for more details on pin usage for the Raspberry Pi. <br />Note: Ultimately the `sensorPin` value will be converted to the WiringPi system, becuase that is the library used by the `dht` program to interact with the pin. However, any of these numbering systems can be used, since this module will convert the `sensorPin` value automatically based on the selected scheme. <br />**Type:** `string`<br />**Default:** `"BCM"`<br />**Options:**<br />- `"BCM"` The standard Raspberry Pi GPIO numbering system<br />- `"BOARD"` The physical pin numbering on the GPIO header<br />- `"WPI"` The WiringPi numbering system
| `tempUnit`              | *Optional* - The unit system to use for the temperature value. <br />**Type:** `string`<br />**Default:** `"celcius"`<br />**Options:** `"celcius"`, `"fahrenheit"`
| `sendTemperature`       | *Optional* - When `true`, an "INDOOR_TEMPERATURE" notification is sent to the other modules when the data is received from the sensor.  This can be used to display the indoor temperature within the built-in 'currentweather' module.<br />**Type:** `boolean`<br />**Default:** `true`
| `sendHumidity`          | *Optional* - When `true`, an "INDOOR_HUMIDITY" notification is sent to the other modules when the data is received from the sensor.  This can be used to display the indoor humidity within the built-in 'currentweather' module.<br />**Type:** `boolean`<br />**Default:** `true`
| `showTemperature`       | *Optional* - When `true`, the module will display the temperature on screen.<br />**Type:** `boolean`<br />**Default:** `false`
| `showHumidity`          | *Optional* - When `true`, the module will display the humidity on screen.<br />**Type:** `boolean`<br />**Default:** `false`
| `scriptPath`            | *Optional* - The location of the `dht` program. This is the fully qualified path including the program file name. <br />**Type:** `string`<br />**Default:** `<module_folder_path>\dht`
| `updateInterval`        | *Optional* - The number of minutes to wait before requesting an update of the data from the sensor. The minimum value is `0.5`. <br />**Type:** `number`<br />**Default:** `5`
| `retryDelay`            | *Optional* - The number of seconds to wait before trying to request the sensor data after a sensor read failure. The minimum value is `10`. Since the reading of the data from the sensor is time sensitive, and can be interrupted by context switching, the `dht` program is told to try up to 3 times.  This option is the amount of time for this module to wait before the next 3 tries. <br />**Type:** `number`<br />**Default:** `10`
| `initialLoadDelay`      | *Optional* - The number of seconds to wait before starting to run this module. The minimum value is `0`. <br />**Type:** `number`<br />**Default:** `0`
| `animationSpeed`        | *Optional* - The number of milliseconds to use for the animation when updating the on-screen display of this module. The minimum value is `0`.<br />**Type:** `number`<br />**Default:** `0`

## Connecting the sensor to the Raspberry Pi

Here are some diagrams that you may find useful when connecting your sensor.  See the [adafruit.com guide](docs/adafruit-dht-sensor-guide.pdf) for more wiring and programming information.

### DHT11 sensor
![Example of a DHT11 sensor with a Raspberry Pi](images/wiring_dht11.png?raw=true "How to connect a DHT11 sensor to a Raspberry Pi")

### DHT22 / AM2302 sensor
![Example of a DHT22 / AM2302 sensor with a Raspberry Pi](images/wiring_dht22.png?raw=true "How to connect a DHT22 sensor to a Raspberry Pi")

### AM2302 sensor with wires
![Example of a AM2302 sensor with a Raspberry Pi](images/wiring_am2302.png?raw=true "How to connect a AM2302 sensor to a Raspberry Pi")

## Customizing the dht program

The `dht` program is a `c` coded program used to read the sensor data. A `c` program is required to read the sensor data because the data is transmitted by extremely short pulses of signal and the `c` code executes much faster than python.

The included `dht` program is something I pieced together based on code from [dht22 by nebulx29](https://github.com/nebulx29/dht22) and the [Python DHT Sensor Library by Adafruit](https://github.com/adafruit/Adafruit_Python_DHT).

If you would like to customize the `dht` program, you can edit the file `dht.c` with your favorite editor, then re-compile it using the following command: `cc -Wall dht.c -o dht -lwiringPi`

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

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
