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
		        getSonosCurrentTrack(node, msg, device.ipaddress);
			});
		});
	}

	//------------------------------------------------------------------------------------------

	function getSonosCurrentTrack(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
        	node.status({fill:"red", shape:"dot", text:"sonos client is null"});
        	return;
        }

        node.client.currentTrack(function (err, trackObj) {
			if (err) {
				node.error(JSON.stringify(err));
				node.status({fill:"red", shape:"dot", text:"failed to retrieve current track"});
				return;
			}
			if (trackObj === null || trackObj === undefined) {
				node.status({fill:"red", shape:"dot", text:"invalid current track retrieved"});
				return;	
			}

			//inject additional properties
			if (trackObj.albumArtURI !== undefined && trackObj.albumArtURI !== null) {
				var port = configNode.port ? configNode.port : 1400;
				trackObj.albumArtURL = "http://" + configNode.serialnum + ":" + port + trackObj.albumArtURI;
			}
			
			msg.payload = trackObj.title;
			msg.track = trackObj;
			node.send(msg);
			node.status({fill:"green", shape:"dot", text:"" + trackObj.title});
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

    RED.nodes.registerType('sonos-currenttrack', Node);
};