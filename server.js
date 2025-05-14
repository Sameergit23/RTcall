const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', socket => {
  socket.on('join', roomID => {
    socket.join(roomID);
    socket.to(roomID).emit('user-joined', socket.id);

    socket.on('offer', (offer, to) => {
      io.to(to).emit('offer', offer, socket.id);
    });

    socket.on('answer', (answer, to) => {
      io.to(to).emit('answer', answer, socket.id);
    });

    socket.on('ice-candidate', (candidate, to) => {
      io.to(to).emit('ice-candidate', candidate, socket.id);
    });

    socket.on('disconnect', () => {
      socket.to(roomID).emit('user-disconnected', socket.id);
    });
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
