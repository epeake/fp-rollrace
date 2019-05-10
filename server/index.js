const http = require('http');
const { app, maps } = require('./server');
const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);

/*
 * First we populate the maps map (lol), then we create the server.  The map
 * comes from our server file and uses tha maps map to fulfull get requests.
 * we populate the maps here to ensure the map is populated the second our
 * our client has loaded the page.
 */
readFile(path.join(__dirname, 'maps/maps.json'))
  .then(contents => {
    const mapsArr = JSON.parse(contents);
    mapsArr.forEach(map => maps.set(map.id, map));

    const server = http.createServer(app).listen(process.env.PORT || 3001); // 3002?); switch these back in production
    console.log('Listening on port %d', server.address().port); // eslint-disable-line no-console
    const io = require('socket.io')(server); // eslint-disable-line global-require

    /*
	use map to store players
	given that socket ids are unique
	this helps remove players
 	when they disconnect

 	NOTE: emitting anything requires sending the data
 	in a JS object
*/
    const players = new Map();
    io.on('connection', socket => {
      socket.on('NEW_PLAYER', (player, fn) => {
        /*
			add the new player to the list of players
			and them emit the new list of players
		*/
        players.set(socket.id, player);

        /*
			tell this newly connected socket about the other players
			player
		*/
        const arr = Array.from(players.values()).filter(playerData => {
          return playerData.key !== socket.id;
        });

        fn(arr);
        // tell all other sockets about the player that just joined
        socket.broadcast.emit('PLAYER', arr);
      });

      socket.on('CHANGE_POS', (player, fn) => {
        players.set(socket.id, player);
        const arr = Array.from(players.values()).filter(playerData => {
          return playerData.key !== socket.id;
        });

        fn(arr);
        // tell all other sockets about the player that just joined
        socket.broadcast.emit('CHANGE_POS', arr);
      });

      socket.on('disconnect', () => {
        // eliminate the player from the container of players
        players.delete(socket.id);
        if (players.length === 0) {
          players.clear();
        }
        // broadcast the updated list to the rest of the players
        io.emit('BROADCAST', players);
      });
    });
  })
  .catch(err => {
    // in this case there was an error parsing the file, so throw and log on server
    console.error(err); // eslint-disable-line no-console
  });
