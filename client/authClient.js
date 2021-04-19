window.onload = init;
username = ""

function init() {
    if (localStorage.getItem("token")) {
        username = localStorage.getItem("user")
    } else {
        window.location.href = "login.html"
    }
}

const socket = io("http://localhost:3000");

const configuration = {
    iceServers: [{
        url: 'stun:stun.l.google.com:19302'
    }]
};
// RTCPeerConnection
let pc;
// RTCDataChannel
let dataChannel;

const drone = new ScaleDrone('0TWOfAypM2OwXlIE');

const roomName = username;

let room;
 

drone.on('open', error => {
  if (error) {
    return console.error(error);
  }
  socket = drone.subscribe(roomName);
  socket.on('open', error => {
    if (error) {
      return console.error(error);
    }
    console.log('Connected to signaling server');
  });

  socket.on('members', members => {
    if (members.length >= 3) {
      return alert('Solamente pueden conectarse 2 coputadoras');
    }

    const isOfferer = members.length === 2;
    startWebRTC(isOfferer);
  });
});

function sendSignalingMessage(message) {
    drone.publish({
        room: roomName,
        message
    });
}

function startWebRTC(isOfferer) {
    console.log('Starting WebRTC in as', isOfferer ? 'offerer' : 'waiter');
    pc = new RTCPeerConnection(configuration);

    // 'onicecandidate' notifica cuando un agente ICE necesita
    // entregar un mensaje al otro nodo
    pc.onicecandidate = event => {
        if (event.candidate) {
        sendSignalingMessage({'candidate': event.candidate});
        }
    };
    
    
    if (isOfferer) {
        pc.onnegotiationneeded = () => {
        pc.createOffer(localDescCreated, error => console.error(error));
        }
        dataChannel = pc.createDataChannel('chat');
        setupDataChannel();
    } else {
        pc.ondatachannel = event => {
        dataChannel = event.channel;
        setupDataChannel();
        }
    }

    startListentingToSignals();
}

function setupDataChannel() {
    checkDataChannelState();
    dataChannel.onopen = checkDataChannelState;
    dataChannel.onclose = checkDataChannelState;
    dataChannel.onmessage = event =>
        insertMessageToDOM(JSON.parse(event.data), false)
}
   
function checkDataChannelState() {
    console.log('WebRTC channel state is:', dataChannel.readyState);
    if (dataChannel.readyState === 'open') {
        insertMessageToDOM({content: 'WebRTC data channel is now open'});
    }
}

function startListentingToSignals() {
    // Listen to signaling data from Scaledrone
    room.on('data', (message, client) => {
      // Message was sent by us
        if (client.id === drone.clientId) {
            return;
        }
        if (message.sdp) {
            // This is called after receiving an offer or answer from another peer
            pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
            console.log('pc.remoteDescription.type', pc.remoteDescription.type);
            // When receiving an offer lets answer it
            if (pc.remoteDescription.type === 'offer') {
                console.log('Respondiendo oferta');
                pc.createAnswer(localDescCreated, error => console.error(error));
            }
            }, error => console.error(error));
        } else if (message.candidate) {
            // Add the new ICE candidate to our connections remote description
            pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    });
}

function localDescCreated(desc) {
    pc.setLocalDescription(
        desc,
        () => sendSignalingMessage({'sdp': pc.localDescription}),
        error => console.error(error)
    );
}

function insertMessageToDOM(options, isFromMe) {
    const template = document.querySelector('template[data-template="message"]');
    const nameEl = template.content.querySelector('.message__name');
    if (options.emoji || options.name) {
        nameEl.innerText = options.emoji + ' ' + options.name;
    }
    template.content.querySelector('.message__bubble').innerText = options.content;
    const clone = document.importNode(template.content, true);
    const messageEl = clone.querySelector('.message');
    if (isFromMe) {
        messageEl.classList.add('message--mine');
    } else {
        messageEl.classList.add('message--theirs');
    }
   
    const messagesEl = document.querySelector('.messages');
    messagesEl.appendChild(clone);
   
    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight - messagesEl.clientHeight;
}

const form = document.querySelector('form');
form.addEventListener('submit', () => {
    const input = document.querySelector('input[type="text"]');
    const value = input.value;
    input.value = '';
    
    const data = {
        username,
        content: value,
    };
    
    dataChannel.send(JSON.stringify(data));
    
    insertMessageToDOM(data, true);
});
 
insertMessageToDOM({content: 'Chat URL is ' + location.href});