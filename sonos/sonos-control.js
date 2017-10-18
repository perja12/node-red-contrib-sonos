// Sonos Play Node - control play/pause/stop function
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

		node.mode = n.mode;
		node.track = n.track;
		node.volume = n.volume;
		if (node.volume === "empty")
			node.volume = "";
		node.volume_value = n.volume_value;
		
        node.status({});
        node.on('input', function (msg) {
            handleInputMsg(node, playnode, msg);
        });
    }

    function handleInputMsg(node, playnode, msg)
    {
		if (node.client === null || node.client === undefined) {
        	node.status({fill:"red", shape:"dot", text:"node.client is null"});
        	return;
        }

		var client = node.client;
        var payload = typeof msg.payload === 'object' ? msg.payload : {};

    	if (payload.mode || node.mode)
			setMode(node, playnode, msg, client, payload);

		// evaluate requested track setting
		if (payload.track || node.track) {
			setTrack(node, playnode, msg, client, payload);
		}

		// evaluate volume setting
		if (payload.volume || node.volume)
			setVolume(node, playnode, msg, client, payload);

		node.send(msg);
    }

    //------------------------------------------------------------------------------------

    // (TBD: discuss if automatic play with track and volume 
	// settings, maybe depending on a node setting "enforce automatic play")
    function setMode(node, playnode, msg, client, payload)
    {
		var _mode = node.mode;
		if (payload.mode) {
			node.log("Node setting overwritten by input: " + payload.mode);
			_mode = payload.mode;
		}

		switch (_mode) 
		{
			case "pause":
				client.pause(function(err, result) {
					handleSonosApiRequest(err, result, msg, "paused", null);
				});
				break;
			case "stop":
				client.stop(function(err, result) {
					handleSonosApiRequest(err, result, msg, "stopped", null);
				});
				break;
			default:
				client.play(function(err, result) {
					handleSonosApiRequest(err, result, msg, "playing", null);
				});
				break;
		}
    }

    function setVolume(node, playnode, msg, client, payload)
    {
    	var _volfkt;
		var _volume;
		if (payload.volume) {
			node.log("Node setting overwritten by input: " + payload.volume);
			if (payload.volume === "vol_up") {
			 _volfkt = "vol_up";
			 _volume = payload.volstep;
			 
			} else if (payload.volume === "vol_down") {
			 _volfkt = "vol_down";
			 _volume = payload.volstep;
			 	
			} else if (payload.volume === "mute") {
			 _volfkt = "mute";
			 	
			} else if (payload.volume === "unmute") {
			 _volfkt = "unmute";
			 	
			} else {
			 _volfkt = "vol_set";
			 _volume = payload.volume;
			}
		
		} else if (node.volume === "volume") {
			node.log("Node setting overwritten by input: " + node.volume_value);
			_volfkt = "vol_set";
			_volume = node.volume_value;
		} else if (node.volume === "vol_up") {
			_volfkt = "vol_up";
			_volume = node.volume_value;
			 
		} else if (node.volume === "vol_down") {
			_volfkt = "vol_up";
			_volume = node.volume_value;
			
		} else if (node.volume === "mute") {
			_volfkt = "mute";
			
		} else if (node.volume === "unmute") {
			_volfkt = "unmute";
			
		}
		
		switch (_volfkt) 
		{
			case "vol_set":
				var volume_val = parseInt(_volume);
				if (volume_val < 0 || volume_val > 100) {
					break;
				}
				client.setVolume(String(_volume), function(err, result) {
					handleSonosApiRequest(err, result, msg, "vol: " + String(_volume), null);
				});
				break;

			case "mute":
				client.setMuted(true, function(err, result) {
					handleSonosApiRequest(err, result, msg, "muted", null);
				});
				break;
			case "unmute":
				client.setMuted(false, function(err, result) {
					handleSonosApiRequest(err, result, msg, "unmuted", null);
				});
				break;
			case "vol_up":
				var volume_step = parseInt(_volume);
				if (volume_step > 100 || volume_step <= 0)
					volume_step = 1;
				client.getVolume(function (err, currentvol) {
					if (err) {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"failed to execute request"});
						return;
					}
				 	var volume_val = parseInt(currentvol) + volume_step;
				 	volume_val = Math.min(100, volume_val);
				 	volume_val = Math.max(0, volume_val);
				 	handleSonosApiRequest(err, result, msg, "vol: " + String(_volume), null);
				});
				break;
			case "vol_down":
				var volume_step = parseInt(_volume);
				if (volume_step > 100 || volume_step <= 0)
					volume_step = 1;
				client.getVolume(function (err, currentvol) {
					if (err) {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"failed to execute request"});
						return;
					}
				 	var volume_val = parseInt(currentvol) - volume_step;
				 	volume_val = Math.min(100, volume_val);
				 	volume_val = Math.max(0, volume_val);
				 	handleSonosApiRequest(err, result, msg, "vol: " + String(_volume), null);
				});
				break;
		}
    }

    function setTrack(node, playnode, msg, client, payload)
    {
    	var _track = node.track;
		if (payload.track)
			_track = payload.track;

		if (_track == "next") {
			client.next(function(err, result) {
				handleSonosApiRequest(err, result, msg, "next", null);
			});
			return;
		}

		if (_track == "previous") {
			client.previous(function(err, result) {
				handleSonosApiRequest(err, result, msg, "previous", null);
			});
			return;
		}
    }

    function handleSonosApiRequest(err, result, msg, successString, failureString) {
    	if (err) {
			node.error(JSON.stringify(err));
			if (!failureString)
				failureString = "failed to execute request";
			node.status({fill:"red", shape:"dot", text:failureString});
			return;
		}

		msg.payload = result;

		if (!successString)
			successString = "request success";
		node.status({fill:"blue", shape:"dot", text:successString});
    }

    RED.nodes.registerType('sonos-control', Node);
};