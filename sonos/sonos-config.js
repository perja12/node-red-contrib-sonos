module.exports = function(RED) 
{
    function SonosPlayerNode(config) {
        RED.nodes.createNode(this, config);

        this.serialnum = config.serialnum;
        this.ipaddress = config.ipaddress;
    }

    //Build API to auto detect IP Addresses
    discoverSonos(function(devices) {
        RED.httpAdmin.get("/sonosSearch", function(req, res) {
            res.json(devices);
        });
    });

    function discoverSonos(discoveryCallback) 
    {
        var sonos = require("sonos");

        var devices = [];
        var search = sonos.search(function(device) {
            device.deviceDescription(function(err, info) {
                if (err) {
                    console.log(err);
                    return;
                }
                var label = "" + info.friendlyName + " (" + info.roomName + ")";
                devices.push({
                    label:label,
                    value:info.serialNum
                });
            });
        });
        search.setMaxListeners(Infinity);

        //Stop searching after 2 seconds
        setTimeout(function() { 
            search.destroy();
        }, 2000);
  
        //Add a bit of delay for all devices to be discovered
        if (discoveryCallback) {
            setTimeout(function() { 
                discoveryCallback(devices);
            }, 2000);
        }
    }

    RED.nodes.registerType("better-sonos-config", SonosPlayerNode);
};