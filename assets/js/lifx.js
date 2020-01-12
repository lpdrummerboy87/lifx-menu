const {ipcRenderer} = require('electron');
const https = require('https');

// Set the color of the lights
function setColor(color) {
    console.log(color.hsl);
    ipcRenderer.send('setColor', color);
}

// send a quit message to app main process
function quit() {
    ipcRenderer.send('quit');
}

// toggle power of light on or off
function togglePower() {
    ipcRenderer.send('togglePower');
}

ipcRenderer.on('powerOn', (event, message) => {
    document.querySelector('#btnPower').className += ' power-on';
});

ipcRenderer.on('powerOff', (event, message) => {
    document.querySelector('#btnPower').classList.remove("power-on");
});

// load views sent from main process
ipcRenderer.on('loadview', (event, message) => {
    console.log(message);
    window.location.href = message + '.html';
});

// display error messages
ipcRenderer.on('displayError', (event, message) => {
    alert(message);
    console.log(message);
    document.querySelector('#errors').innerHTML = message;
});
