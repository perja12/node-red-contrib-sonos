# node-red-contrib-better-sonos

A set of nodes to control SONOS via NodeRED. 

Uses the [**sonos Module**](https://github.com/bencevans/node-sonos).

Forked, renamed & improved from the [**node-red-contrib-sonos**](https://github.com/shbert/node-red-contrib-sonos) since the author seems to have stopped working on it.

Open points / not tested yet:
 * manipulating playlists
 * zone configurations / grouping feature
 * controlling stereo and or surround configurations
 * automatic detection of play configuration
 * current volume

## Installation

`npm install node-red-contrib-sonos`

## Implemented Nodes

Control - controls one SONOS player, by reacting on a JSON payload. 
Available modes: 
* `"mode":play,pause,stop` 
* `"track":next,previous`
* `"volume":1..100,mute,unmute`

Current Track - returns the currently played track

Current Volume - returns the current volume

Queue - controls one SONOS player, by reacting on a JSON payload.
Available modes:
* `"songuri":<uri of the song to be queued>`
* `"position":0..<max_queue_length>,next`
