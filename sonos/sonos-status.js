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
					node.status({fill:"red", shape:"dot", text:"error looking for device " + configNode.serialnum});
					return;
				}
				if (device === null) {
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

        client.currentTrack(function (err, trackObj) {
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
				var port = 1400;
				trackObj.albumArtURL = "http://" + ipaddress + ":" + port + trackObj.albumArtURI;
			}
			
			//output 2
			msg.payload = trackObj.title;
			msg.track = trackObj;
			node.send([null, msg]);

			getSonosVolume(node, msg, ipaddress);
		});
	}
	
	function getSonosVolume(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
        	node.status({fill:"red", shape:"dot", text:"sonos client is null"});
        	return;
        }

		client.getVolume(function(err, volume) {
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

			//output 1
			msg.volume = volume;
			msg.normalized_volume = volume / 100.0;
			node.send(msg);
			
			//volume + current track
			var text = "vol:" + volume;
			if (msg.payload)
				text += " • " + msg.payload;
			node.status({fill:"green", shape:"dot", text:text});
		});
	}


	//------------------------------------------------------------------------------------------

	function findSonos(node, serialNumber, callback) 
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

    RED.nodes.registerType('better-sonos-status', Node);
};