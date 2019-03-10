const miio = require('miio')

let Service, Characteristic

module.exports = homebridge => {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-mi-heater', 'MiHeater', MiHeater)
}

class MiHeater {

  constructor(log, config) {
    this.log = log
    this.ip = config.ip
    this.token = config.token
    this.name = config.name || 'MiHeater'

	
	
	this.services = []

    if (!this.ip)
      throw new Error('Your must provide IP address of the MiHeater.')

    if (!this.token)
      throw new Error('Your must provide token of the MiHeater.')
  
    this.service = new Service.HeaterCooler(this.name)

    // Active
    this.service
      .getCharacteristic(Characteristic.Active)
      .on('get', this.getActive.bind(this))
      .on('set', this.setActive.bind(this))
	  
	this.service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this))
	  
	this.service
      .getCharacteristic(Characteristic.CurrentHeaterCoolerState)
      .on('get', this.getCurrentHeaterCoolerState.bind(this))
	  .setProps({
            validValues: [0,2]
      })
	  
	this.service
      .getCharacteristic(Characteristic.TargetHeaterCoolerState)
      .setValue(Characteristic.TargetHeaterCoolerState.HEAT)
	  .setProps({
            validValues: [1]
      })
	  
	this.service
      .addCharacteristic(Characteristic.LockPhysicalControls)
	  .on('get', this.getLockPhysicalControls.bind(this))
	  .on('set', this.setLockPhysicalControls.bind(this))
	  
	this.service
      .addCharacteristic(Characteristic.HeatingThresholdTemperature)
      .on('get', this.getHeatingThresholdTemperature.bind(this))
      .on('set', this.setHeatingThresholdTemperature.bind(this))
	  .setProps({
		  minValue: config.mintemp,
          maxValue: config.maxtemp, 
          minStep: 1, 
        })
		
    this.service
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getCurrentRelativeHumidity.bind(this))
	  
	this.serviceInfo = new Service.AccessoryInformation()

    this.serviceInfo
      .setCharacteristic(Characteristic.Manufacturer, 'Smartmi')
      .setCharacteristic(Characteristic.Model, 'MiHeater')
      .setCharacteristic(Characteristic.SerialNumber, config.ip)

    this.services.push(this.service)
    this.services.push(this.serviceInfo)
	
	this.discover()
  }

  getServices() {
    return this.services
  }

  async discover() {
    try {
      this.device = await miio.device({ address: this.ip, token: this.token })
    } catch (e) {
      this.log.error(e)
    }
  }
  
  async getActive(callback) {
    try {
      const [ power ] = await this.device.call('get_prop', ['power'])

      callback(
        null,
        (power === 'on')
          ? Characteristic.Active.ACTIVE
          : Characteristic.Active.INACTIVE
      )
    } catch (e) {
      this.log.error('getActive', e)
      callback(e)
    }
  }

  async setActive(state, callback) {
    try {
      const power = (state === Characteristic.Active.ACTIVE)
        ? 'on'
        : 'off'

      const [ result ] = await this.device.call('set_power', [power])

      if (result !== 'ok')
        throw new Error(result)

      callback()
    } catch (e) {
      this.log.error('setActive', e)
      callback(e)
    }
  }
  
  async getLockPhysicalControls(callback) {
    try {
      const [ child_lock ] = await this.device.call('get_prop', ['child_lock'])

      callback(
        null,
        (child_lock === 'on')
          ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
          : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED
      )
    } catch (e) {
      this.log.error('getLockPhysicalControls', e)
      callback(e)
    }
  }

  async setLockPhysicalControls(state, callback) {
    try {
      const child_lock = (state === Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED)
        ? 'on'
        : 'off'

      const [ result ] = await this.device.call('set_child_lock', [child_lock])

      if (result !== 'ok')
        throw new Error(result)

      callback()
    } catch (e) {
      this.log.error('setLockPhysicalControls', e)
      callback(e)
    }
  }
  
  async getCurrentTemperature(callback) {
    try {
      const [ temperature ] = await this.device.call('get_prop', ['temperature'])
      callback(null, temperature)
    } catch (e) {
      this.log.error('getCurrentTemperature', e)
      callback(e)
    }
  }
  
  async getCurrentHeaterCoolerState(callback) {
    try {
      const [ power ] = await this.device.call('get_prop', ['power'])
      callback(
        null,
        (power === 'on')
          ? Characteristic.CurrentHeaterCoolerState.HEATING
          : Characteristic.CurrentHeaterCoolerState.INACTIVE
      )
    } catch (e) {
      this.log.error('getCurrentHeaterCoolerState', e)
      callback(e)
    }
  }
  
  async getCurrentRelativeHumidity(callback) {
    try {
      const [ humidity ] = await this.device.call('get_prop', ['relative_humidity'])
      callback(null, humidity)
    } catch (e) {
      this.log.error('getCurrentRelativeHumidity', e)
      callback(e)
    }
  }
  
  async getHeatingThresholdTemperature(callback) {
    try {
      const [ target_temperature ] = await this.device.call('get_prop', ['target_temperature'])
      callback(null, target_temperature)
    } catch (e) {
      this.log.error('getHeatingThresholdTemperature', e)
      callback(e)
    }
  }
  async setHeatingThresholdTemperature(value, callback) {
	  try {
      const [ result ] = await this.device.call('set_target_temperature', [value])
      if (result !== 'ok')
        throw new Error(result)
      callback()	
    } catch (e) {
      this.log.error('setHeatingThresholdTemperature', e)
      callback(e)
    }
  }	  
}
