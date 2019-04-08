const http = require('http');
const { app } = require('./server');

const server = http.createServer(app).listen(3001 || process.env.PORT); // switch these back in production

console.log('Listening on port %d', server.address().port); // eslint-disable-line no-console

const io = require('socket.io')(server);

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
    const arr = Array.from(players.values());
    console.log(arr);
    fn(arr);
    // tell all other sockets about the player that just joined
    io.emit('PLAYER', arr);
  });

  socket.on('disconnect', () => {
    // eliminate the player from the container of players
    players.delete(socket.id);
    // broadcast the updated list to the rest of the players
    io.emit('BROADCAST', { players: players });
  });
});
