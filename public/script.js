const socket = io();
let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let roomID = '';

async function joinCall() {
  roomID = document.getElementById('roomInput').value;
  if (!roomID) return alert('Enter Room ID');

  socket.emit('join', roomID);

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

socket.on('user-joined', async userId => {
  peerConnection = createPeerConnection(userId);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, userId);
});

socket.on('offer', async (offer, from) => {
  peerConnection = createPeerConnection(from);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, from);
});

socket.on('answer', async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async (candidate) => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

function createPeerConnection(remoteID) {
  const pc = new RTCPeerConnection(config);

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('ice-candidate', e.candidate, remoteID);
    }
  };

  pc.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  return pc;
}
