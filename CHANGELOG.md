# MMM-LocalTemperature Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.4.0] - 2021-09-19

### Added
- An option to decide whether or not to use `sudo` when calling the sensor script
- Spanish Translation (thanks to [rafagale](https://github.com/rafagale))

### Fixed
- The DOM may try to load when there is no sensor data

## [1.3.0] - 2019-11-13

### Added
- Added the ability to specify icons in the `temperatureText` and `humidityText` options

### Changed
- Updated the readme to explain how to use the new icon feature

### Fixed
- Bug fixed for the animation speed value validation

## [1.2.0] - 2019-05-22

### Added
- French Translation (thanks to [laventin85](https://github.com/laventin85))
- Number validation now accounts for NaN values
- README instructions for choosing a specific version of this module

### Fixed
- Console error when resuming the module (lastUpdateTime variable initialized and updated)
- Check for 'object' type when checking for axis.js script
- Hide "Socket Notification Received" message for non-development mode

## [1.1.0] - 2018-06-05

### Added
- Icon View

## [1.0.0] - 2018-06-04

Initial Release of the MMM-LocalTemperature module. 

## [0.2.0] - 2018-05-27

Pre-Release of the MMM-LocalTemperature module for testing purposes. 

## [0.1.0] - 2018-05-27

Pre-Release of the MMM-LocalTemperature module for testing purposes. 
