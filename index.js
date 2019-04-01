var fs = require('fs');
const miio = require('miio');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "MiHeater")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-mi-heater', 'MiHeater', MiHeater);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function MiHeater(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.config = config;
    
    this.log.info("[MiHeater][INFO]***********************************************************");
    this.log.info("[MiHeater][INFO]          MiHeater v%s by hassbian-ABC 0.0.1");
    this.log.info("[MiHeater][INFO]  GitHub: https://github.com/hassbian-ABC/homebridge-MiHeater ");
    this.log.info("[MiHeater][INFO]                                                                  ");
    this.log.info("[MiHeater][INFO]***********************************************************");
    this.log.info("[MiHeater][INFO]start success...");


    var that = this;
    this.device = new miio.Device({
        address: that.config.ip,
        token: that.config.token
		
    });
}

MiHeater.prototype = {
    identify: function(callback) {
        callback();
    },

    getServices: function() {
        var that = this;
        var services = [];

        var infoService = new Service.AccessoryInformation();
        infoService
            .setCharacteristic(Characteristic.Manufacturer, "xiaomi")
            .setCharacteristic(Characteristic.Model, "smartmi")
            .setCharacteristic(Characteristic.SerialNumber, this.config.ip);
        services.push(infoService);
		
	    var heaterService = new Service.HeaterCooler(this.name);
        var currentTemperatureCharacteristic = heaterService.getCharacteristic(Characteristic.CurrentTemperature);
        var currentHeaterCoolerStateCharacteristic = heaterService.getCharacteristic(Characteristic.CurrentHeaterCoolerState);
	    currentHeaterCoolerStateCharacteristic.setProps({
            validValues: [0,2]
        });
        var targetHeaterCoolerStateCharacteristic = heaterService.getCharacteristic(Characteristic.TargetHeaterCoolerState);
        targetHeaterCoolerStateCharacteristic.setProps({
            validValues: [1]
        });

        var activeCharacteristic = heaterService.getCharacteristic(Characteristic.Active);
        var lockPhysicalControlsCharacteristic = heaterService.addCharacteristic(Characteristic.LockPhysicalControls);
	    

        var currentHumidityCharacteristic = heaterService.addCharacteristic(Characteristic.CurrentRelativeHumidity);
		var temperatureDisplayUnitsCharacteristic = heaterService.addCharacteristic(Characteristic.TemperatureDisplayUnits);
		temperatureDisplayUnitsCharacteristic.setValue(Characteristic.TemperatureDisplayUnits.CELSIUS)
		temperatureDisplayUnitsCharacteristic.setProps({
            validValues: [0]
        });

		
		heaterService
		   .getCharacteristic(Characteristic.HeatingThresholdTemperature)
		   .setProps({
		        minValue: that.config.mintemp, 
                maxValue: that.config.maxtemp, 
                minStep: 1, 
            })
		   .on('get', function(callback) {
			   that.device.call("get_prop", ["power", "relative_humidity", "child_lock", "target_temperature", "temperature"]).then(result => {
		            that.log.debug("[MiHeater][DEBUG]activeCharacteristic - get: " + result);
					if (result[0] === "on") {
						activeCharacteristic.updateValue(Characteristic.Active.ACTIVE);
						currentHeaterCoolerStateCharacteristic.updateValue(Characteristic.CurrentHeaterCoolerState.HEATING);
					} else if (result[0] === "off") {
						activeCharacteristic.updateValue(Characteristic.Active.INACTIVE);
					    currentHeaterCoolerStateCharacteristic.updateValue(Characteristic.CurrentHeaterCoolerState.INACTIVE);
					}
					currentHumidityCharacteristic.updateValue(result[1]);
					currentTemperatureCharacteristic.updateValue(result[4]);

					if (result[2] === "on") {
						lockPhysicalControlsCharacteristic.updateValue(Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED);
					} else if (result[2] === "off") {
						lockPhysicalControlsCharacteristic.updateValue(Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
					}
					callback(null, result[3])
					}).catch(function(err) {
			    that.log.error("[MiHeater][DEBUG]activeCharacteristic - getActive Error: " + err);
                callback(err);
            });
            }.bind(this))
			.on('set', function(value, callback) {
		         that.log.debug("[MiHeater][DEBUG]heatingThresholdTemperatureCharacteristic - set_target_temperature: " + value);
                 that.device.call("set_target_temperature", [value]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                    }).catch(function(err) {
			           that.log.debug("[MiHeater][DEBUG]heatingThresholdTemperatureCharacteristic - set_target_temperature: " + err);
                       callback(err);
                    });
            }.bind(this));
					
					
		
        activeCharacteristic  
            .on('set', function(value, callback) {
                that.device.call("set_power", [value ? "on" : "off"]).then(result => {
			    that.log.debug("[MiHeater][DEBUG]activeCharacteristic - setActive Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));
                    }            
                }).catch(function(err) {
				    that.log.error("[MiHeater][DEBUG]activeCharacteristic - setActive Error: " + err);
                callback(err);
            });
        }.bind(this));

		

        targetHeaterCoolerStateCharacteristic.setValue(Characteristic.TargetHeaterCoolerState.HEAT);


        lockPhysicalControlsCharacteristic
           .on('set', function(value, callback) {
		      that.log.debug("[MiHeater][DEBUG]lockPhysicalControlsCharacteristic - setchildlock: " + value);
              that.device.call("set_child_lock", [value ? "on" : "off"]).then(result => {
                  if(result[0] === "ok") {
                     callback(null);
                  } else {
                     callback(new Error(result[0]));
                  }            
                }).catch(function(err) {
			         that.log.debug("[MiHeater][DEBUG]lockPhysicalControlsCharacteristic - setchildlock: " + err);
                callback(err);
            });
        }.bind(this));
			
	services.push(heaterService);
	
    return services;

	} 	
}
