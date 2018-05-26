/*
 *  dht.c:
 *      Author: Juergen Wolf-Hofer
 *      based on / adapted from http://www.uugear.com/portfolio/read-dht1122-temperature-humidity-sensor-from-raspberry-pi/
 *	reads temperature and humidity from DHT11 or DHT22 sensor and outputs according to selected mode
 */

#include <wiringPi.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <errno.h>
#include <sched.h>
#include <string.h>
#include <sys/time.h>
#include <time.h>

// CONSTANTS
#define MAX_TIMINGS	85
#define WAIT_TIME 3000
#define DHT_MAXCOUNT 32000
#define DHT_PULSES 41
#define DHT_ERROR_TIMEOUT 2
//#define DHT11 11
//#define DHT22 22

// GLOBAL VARIABLES
uint8_t dht_pin = 3;  // default GPIO 22 (wiringPi 3)
char mode = 'c';      // valid modes are c, f, h, j

int data[5] = { 0, 0, 0, 0, 0 };
int debug = 0;
//int type = DHT22;
float temp_c = -1;
float temp_f = -1;
float humidity  = -1;

// FUNCTION DECLARATIONS
int init();
void printUsage();
int read_dht_data();

void busy_wait_milliseconds(uint32_t millis);
void sleep_milliseconds(uint32_t millis);
void set_max_priority(void);
void set_default_priority(void);

// FUNCTION DEFINITIONS
void busy_wait_milliseconds(uint32_t millis) {
  // Set delay time period.
  struct timeval deltatime;
  deltatime.tv_sec = millis / 1000;
  deltatime.tv_usec = (millis % 1000) * 1000;
  struct timeval walltime;
  // Get current time and add delay to find end time.
  gettimeofday(&walltime, NULL);
  struct timeval endtime;
  timeradd(&walltime, &deltatime, &endtime);
  // Tight loop to waste time (and CPU) until enough time as elapsed.
  while (timercmp(&walltime, &endtime, <)) {
    gettimeofday(&walltime, NULL);
  }
}

void sleep_milliseconds(uint32_t millis) {
  struct timespec sleep;
  sleep.tv_sec = millis / 1000;
  sleep.tv_nsec = (millis % 1000) * 1000000L;
  while (clock_nanosleep(CLOCK_MONOTONIC, 0, &sleep, &sleep) && errno == EINTR);
}

void set_max_priority(void) {
  struct sched_param sched;
  memset(&sched, 0, sizeof(sched));
  // Use FIFO scheduler with highest priority for the lowest chance of the kernel context switching.
  sched.sched_priority = sched_get_priority_max(SCHED_FIFO);
  sched_setscheduler(0, SCHED_FIFO, &sched);
}

void set_default_priority(void) {
  struct sched_param sched;
  memset(&sched, 0, sizeof(sched));
  // Go back to default scheduler with default 0 priority.
  sched.sched_priority = 0;
  sched_setscheduler(0, SCHED_OTHER, &sched);
}

int read_dht_data() {
	//uint8_t laststate = HIGH;
	//uint8_t counter	= 0;
	//uint8_t j = 0;
	//uint8_t i;

	// Store the count that each DHT bit pulse is low and high.
  // Make sure array is initialized to start at zero.
  int pulseCounts[DHT_PULSES*2] = {0};

	data[0] = data[1] = data[2] = data[3] = data[4] = 0;

	// Set pin to output.
	pinMode(dht_pin, OUTPUT);

	// Bump up process priority and change scheduler to try to try to make process more 'real time'.
	set_max_priority();

	// Set pin high for ~500 milliseconds.
	digitalWrite(dht_pin, HIGH);
	sleep_milliseconds(500);
	//delay(500);

	// The next calls are timing critical and care should be taken
	// to ensure no unnecssary work is done below.

	// Set pin low for ~20 milliseconds.
	digitalWrite(dht_pin, LOW);
	busy_wait_milliseconds(20);
	//delay(20);

	// Set pin yo input.
	pinMode(dht_pin, INPUT);
	// Need a very short delay before reading pins or else value is sometimes still low.
	for (volatile int i = 0; i < 50; ++i) {
	}

	// Wait for DHT to pull pin low.
	uint32_t count = 0;
	while (digitalRead(dht_pin)) {
		if (++count >= DHT_MAXCOUNT) {
			// Timeout waiting for response.
			set_default_priority();
			temp_c = temp_f = humidity = -1;
			return 1;
		}
	}

	// Record pulse widths for the expected result bits.
	for (int i = 0; i < DHT_PULSES * 2; i += 2) {
		// Count how long pin is low and store in pulseCounts[i]
		while (!digitalRead(dht_pin)) {
			if (++pulseCounts[i] >= DHT_MAXCOUNT) {
				// Timeout waiting for response.
				set_default_priority();
				temp_c = temp_f = humidity = -1;
				return 1;
			}
		}
		// Count how long pin is high and store in pulseCounts[i+1]
		while (digitalRead(dht_pin)) {
			if (++pulseCounts[i+1] >= DHT_MAXCOUNT) {
				// Timeout waiting for response.
				set_default_priority();
				temp_c = temp_f = humidity = -1;
				return 1;
			}
		}
	}
	// Done with timing critical code, now interpret the results.

	// Drop back to normal priority.
	set_default_priority();

	// Compute the average low pulse width to use as a 50 microsecond reference threshold.
	// Ignore the first two readings because they are a constant 80 microsecond pulse.
	uint32_t threshold = 0;
	for (int i = 2; i < DHT_PULSES * 2; i += 2) {
		threshold += pulseCounts[i];
	}
	threshold /= DHT_PULSES - 1;

	// Interpret each high pulse as a 0 or 1 by comparing it to the 50us reference.
	// If the count is less than 50us it must be a ~28us 0 pulse, and if it's higher
	// then it must be a ~70us 1 pulse.
	uint8_t data[5] = {0};
	for (int i = 3; i < DHT_PULSES * 2; i += 2) {
		int index = (i - 3) / 16;
		data[index] <<= 1;
		if (pulseCounts[i] >= threshold) {
			// One bit for long pulse.
			data[index] |= 1;
		}
		// Else zero bit for short pulse.
	}

	// Useful debug info:
	if (debug) printf("Data: 0x%x 0x%x 0x%x 0x%x 0x%x\n", data[0], data[1], data[2], data[3], data[4]);

	// Verify checksum of received data.
	if (data[4] == ((data[0] + data[1] + data[2] + data[3]) & 0xFF)) {

		float h = (float)((data[0] << 8) + data[1]) / 10;
		if ( h > 100 ) {
			h = data[0];	// for DHT11
		}
		float c = (float)(((data[2] & 0x7F) << 8) + data[3]) / 10;
		if ( c > 125 ) {
			c = data[2];	// for DHT11
		}
		if ( data[2] & 0x80 ) {
			c = -c;
		}
		temp_c = c;
		temp_f = c * 1.8f + 32;
		humidity = h;

		/* alternative method to calculate the temperatures
		if (type == DHT11) {
			// Get humidity and temp for DHT11 sensor.
			humidity = (float)data[0];
			temp_c = (float)data[2];
			temp_f = temp_c * 1.8f + 32;
		}
		else if (type == DHT22) {
			// Calculate humidity and temp for DHT22 sensor.
			humidity = (data[0] * 256 + data[1]) / 10.0f;
			temp_c = ((data[2] & 0x7F) * 256 + data[3]) / 10.0f;
			if (data[2] & 0x80) {
				temp_c *= -1.0f;
			}
			temp_f = temp_c * 1.8f + 32;
		}
		*/

		if (debug) printf( "read_dht_data() Humidity = %.1f %% Temperature = %.1f *C (%.1f *F)\n", humidity, temp_c, temp_f );
		return 0; // OK
	} else {
		if (debug) printf( "read_dht_data() Data not good, skip\n" );
		temp_c = temp_f = humidity = -1;
		return 1; // Error
	}

}

void printUsage() {
	fprintf(stdout, "Usage: dht c|f|h|j pin\n"
                  "    c . . . temperature in celsius\n"
                  "    f . . . temperature in fahrenheit\n"
                  "    h . . . humidity\n"
                  "    j . . . JSON string with all three\n"
                  "    pin . . GPIO pin (wiringPi numbering)\n");
}

int init() {
	if (wiringPiSetup() == -1) {
		fprintf(stderr, "Failed to initialize wiringPi\n");
		exit(1);
		return 1;
	}
	return 0;
}

int main(int argc, char *argv[]) {
	int done = 0;

	if (argc != 3 && argc != 4) {
		printUsage();
		exit(1);
		return 1;
	} else {
		mode = argv[1][0]; // First argument, first character in the 'string'
		dht_pin = atoi(argv[2]); // Second argument, pin number
		if (mode != 'c' && mode != 'f' && mode != 'h' && mode != 'j') {
			printUsage();
			exit(1);
			return 1;
		}
	}
	if (argc == 4 && argv[3][0] == 'd') { debug = 1; }
	if (debug) fprintf(stdout, "Reading DHT22... mode: %c PIN: %i\n", mode, dht_pin);

	init();

	while (!done) {
		done = !read_dht_data();
		delay(WAIT_TIME);
	}

	switch(mode) {
		case 'c':
			fprintf(stdout, "%.1f\n", temp_c);
			break;
		case 'f':
			fprintf(stdout, "%.1f\n", temp_f);
			break;
		case 'h':
			fprintf(stdout, "%.1f\n", humidity);
			break;
		case 'j':
			fprintf(stdout, "{ \"humidity\": %.1f, \"celcius\": %.1f, \"fahrenheit\": %.1f }\n", humidity, temp_c, temp_f);
			break;
		default:
			fprintf(stderr, "invalid mode '%c', should not happen\n", mode);
	}

	if (debug) printf( "main() Humidity = %.1f %% Temperature = %.1f *C (%.1f *F)\n", humidity, temp_c, temp_f );

	return(0);
}
