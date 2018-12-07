## Note: 
 If you find bugs, please submit them to issues or QQ Group: 107927710.

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
(sudo)npm install -g miio https://github.com/hassbian-ABC/homebridge-Mi-Heater
```


```
"accessories": [
    {
      "accessory": "MiHeater",
      "name": "MiHeater",
      "ip": "192.168.1.77",
      "token": "7251f2fdc5eda606d9125d882c932914"
    }
  ]
```
## Get token
Open command prompt or terminal. Run following command:   
```
miio discover
```
Wait until you get output similar to this:   
```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```
