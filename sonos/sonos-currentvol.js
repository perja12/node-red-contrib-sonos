module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this, n);
		var node = this;
		
		var configNode = RED.nodes.getNode(n.confignode); 
		if (configNode === undefined || configNode === null) {
        	node.status({fill:"red", shape:"ring", text:"please select a config node"});
        	return;
        }
        if (configNode.serialnum === undefined || configNode === null) {
        	node.status({fill:"red", shape:"ring", text:"missing serial number in config node"});
        	return;
        }

        //clear node status
        node.status({});

		//handle input message
        node.on('input', function (msg) {            
            if (configNode === undefined || configNode === null) {
	        	node.status({fill:"red", shape:"ring", text:"please select a config node"});
	        	return;
	        }
	        if (configNode.serialnum === undefined || configNode === null) {
	        	node.status({fill:"red", shape:"ring", text:"missing serial number in config node"});
	        	return;
	        }

			//first find the Sonos IP address from given serial number
			findSonos(node, configNode.serialnum, function(err, device) {
				if (err) {
					node.status({fill:"red", shape:"dot", text:"device " + configNode.serialnum + " not found"});
					return;
				}
		        getSonosVolume(node, msg, device.ipaddress);
			});
		});
	}

	//------------------------------------------------------------------------------------------

	function getSonosVolume(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
        	node.status({fill:"red", shape:"dot", text:"sonos client is null"});
        	return;
        }

		client.getSonosVolume(function(err, volume) {
			if (err) {
				node.error(JSON.stringify(err));
				node.status({fill:"red", shape:"dot", text:"failed to retrieve volume"});
				return;
			}
			if (volume === null || volume === undefined) {
				node.status({fill:"red", shape:"dot", text:"invalid volume retrieved"});
				return;	
			}
			if (volume < 0 || volume > 100) {
				node.status({fill:"red", shape:"dot", text:"invalid volume range retrieved"});
				return;	
			}

			msg.payload = volume;
			msg.normalized = volume / 100.0;
			node.send(msg);
			
			node.status({fill:"green", shape:"dot", text:"vol: " + volume});
		});
	}

	//------------------------------------------------------------------------------------------

	function findSonos(node, serialNumber, callback) 
	{
        var sonos = require("sonos");
        var search = sonos.search(function(device) {
            device.deviceDescription(function(err, info) {
                if (err) {
                	callback(err, null)
                   	return;
                }

                //Inject additional property
                var deviceIp = info.friendlyName.split("-")[0].trim();
                device.ipaddress = deviceIp;

                var isMatch = false;
            	if (device.serialNum !== undefined && device.serialNum !== null) 
            		if (device.serialNum.trim().toUpperCase() == serialNumber.trim().toUpperCase())
            			isMatch = true;

                if (isMatch && callback)
                	callback(null, device);

                if (isMatch)
                	search.destroy();
            });
        });
        search.setMaxListeners(Infinity);
	}

    RED.nodes.registerType('sonos-currentvol', Node);
};
