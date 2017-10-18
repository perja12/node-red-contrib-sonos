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

		//Hmmm?		
		node.songuri = n.songuri;
		node.position = n.position;
		if (node.position === "empty") {
			node.position = "";
		}
		node.positioninqueue = n.positioninqueue;

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
		        setSonosQueue(node, msg, device.ipaddress);
			});
		});
	}

	function setSonosQueue(node, msg, ipaddress)
	{
        var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
        	node.status({fill:"red", shape:"dot", text:"sonos client is null"});
        	return;
        }

		var payload = typeof msg.payload === 'object' ? msg.payload : {};

		var _songuri = node.songuri;
		if (payload.songuri)
			_songuri = payload.songuri;
		
		if (node.position === "next" || payload.position === "next") {
			node.log("Queueing URI next: " + _songuri);
			client.queueNext(_songuri, function (err, result) {
				msg.payload = result;
				node.send(msg);
				if (err) {
					node.log(JSON.stringify(err));
				}
				node.log(JSON.stringify(result));
			});
		} 
		else if (node.position === "directplay" || payload.position === "directplay") {
			node.log("Direct play URI: " + _songuri);
			client.play(_songuri, function (err, result) {
				msg.payload = result;
				node.send(msg);
				if (err) {
					node.log(JSON.stringify(err));
				}
				node.log(JSON.stringify(result));
			});
		} 
		else {				
			// Default is append to the end of current queue
			var set_position = 0;
			// Evaluate different inputs (json payload preferred, node option second, default third)
			if (payload.position) {
				set_position = payload.position;
			} else if (node.positioninqueue) {
				if (isNaN(node.positioninqueue) == false) {
					set_position = parseInt(node.positioninqueue, 10);
				}
			}
			// Queue song now
			node.log("Queuing at " + set_position + " URI: " + _songuri );
			client.queue(_songuri, set_position, function (err, result) {
				msg.payload = result;
				node.send(msg);
				if (err) {
					node.log(JSON.stringify(err));
				}
				node.log(JSON.stringify(result));
			});
		}
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

    RED.nodes.registerType('sonos-queue', Node);
};