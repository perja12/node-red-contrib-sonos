// Sonos Current Track node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this, n);
		var node = this;
		
		var playnode = RED.nodes.getNode(n.playnode); 
		if (playnode === null || playnode === undefined) {
        	node.status({fill:"red", shape:"ring", text:"please select a config node"});
        	return;
        }

		node.client = new sonos.Sonos(playnode.ipaddress);
		if (node.client === null || node.client === undefined) {
        	node.status({fill:"red", shape:"dot", text:"node.client is null"});
        	return;
        }

        node.status({});
        node.on('input', function (msg) {            
            if (node.client === null || node.client === undefined) {
            	node.status({fill:"red", shape:"dot", text:"node.client is null"});
            	return;
            }
			
			node.client.getVolume(function (err, volume) {
				if (err) {
					node.error(JSON.stringify(err));
					node.status({fill:"red", shape:"dot", text:"failed to retrieve volume"});
					return;
				}
				if (volume === null || volume === undefined) {
					node.status({fill:"red", shape:"dot", text:"invalid volume retrieved"});
					return;	
				}

				msg.payload = volume;
				msg.normalized = volume / 100.0;
				node.send(msg);
				node.status({fill:"green", shape:"dot", text:"vol: " + volume});
			});
		});
	}

    RED.nodes.registerType('sonos-currentvol', Node);
};
