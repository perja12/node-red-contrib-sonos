class SonosHelper 
{
    constructor() {
    }

    validateConfigNode(node, configNode)
    {
        if (configNode === undefined || configNode === null) {
            node.status({fill:"red", shape:"ring", text:"please select a config node"});
            return false;
        }
        if (configNode.serialnum === undefined || configNode === null) {
            node.status({fill:"red", shape:"ring", text:"missing serial number in config node"});
            return false;
        }

        //clear node status
        node.status({});
        return true;
    }

    preprocessInputMsg(node, configNode, msg, callback)
    {
        var isValid = this.validateConfigNode(node, configNode);
        if (!isValid)
            return;

        //first find the Sonos IP address from given serial number
        this.findSonos(node, configNode.serialnum, function(err, device) {
            if (err) {
                node.status({fill:"red", shape:"dot", text:"error looking for device " + configNode.serialnum});
                return;
            }
            if (device === null) {
                node.status({fill:"red", shape:"dot", text:"device " + configNode.serialnum + " not found"});
                return; 
            }

            if (callback)
                callback(device);
        });
    }

    findSonos(node, serialNumber, callback) 
    {
        var foundMatch = false;
        var sonos = require("sonos");
        var search = sonos.search(function(device) {
            device.deviceDescription(function(err, info) {
                if (err) {
                    node.error(JSON.stringify(err));
                    callback(err, null)
                    return;
                }

                //Inject additional property
                if (info.friendlyName !== undefined && info.friendlyName !== null)
                    info.ipaddress = info.friendlyName.split("-")[0].trim();
                if (device.host)
                    info.ipaddress = device.host;

                //We use 2 different ways to obtain serialnum Sonos API
                if (info.serialNum !== undefined && info.serialNum !== null)
                    if (info.serialNum.trim().toUpperCase() == serialNumber.trim().toUpperCase())
                        foundMatch = true;
                if (device.serialNumber !== undefined && device.serialNumber !== null)
                    if (device.serialNumber.trim().toUpperCase() == serialNumber.trim().toUpperCase())
                        foundMatch = true;

                if (foundMatch && callback)
                    callback(null, info);

                if (foundMatch) {
                    search.destroy();
                    search = null;
                }
            });
        });
        search.setMaxListeners(Infinity);

        //In case there is no match
        setTimeout(function() { 
            if (!foundMatch && callback)
                callback(null, null);
            if (search !== null)
                search.destroy();
        }, 3000);
    }
}
module.exports = SonosHelper;