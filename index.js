/**
 * This is the app main process file
 */

const { menubar } = require('menubar');
const { ipcMain } = require('electron');
const keytar = require('keytar');
const lifx = require('lifx-http-api');

// create the menubar instance
const mb = menubar({
    browserWindow: {
        webPreferences: {
            nodeIntegration: true
        },
        width: 280,
        height: 365,
        alwaysOnTop: false,
        resizable: false
    },
    tooltip: "LIFX Menu",
    preloadWindow: true,
});

// menubar app ready function
mb.on('ready', () => {
    console.log('app is ready');
    // your app code here

    // check for lifx api token and direct to settings page if not set
    keytar.getPassword('lifx', 'apitoken')
    .then((result) => {
        if (!result) {
            console.log("LIFX API Token not set.");
            global.lifxApiToken = null;
            mb.window.setSize(280, 160);
            mb.window.webContents.send('loadview', 'apitoken');
        } else {
            console.log("LIFX API Token: " + result);
            global.lifxApiToken = result;

            // get current power state and color
            var client = new lifx({
                bearerToken: lifxApiToken
            });
            client.listLights('all', function(err, data) {
                console.log(data);

                if (data[0].power === 'on') {
                    powerOn = true;
                    mb.window.webContents.send('powerOn');
                } else {
                    powerOn = false;
                    mb.window.webContents.send('powerOff');
                }
                
                var color = {
                    h: data[0].color.hue,
                    s: data[0].color.saturation,
                    l: data[0].brightness
                }

                mb.window.webContents.send('setColor', color);
            });
        }
    });
});

// open dev tools for debugging
// mb.on('after-create-window', () => {
//     mb.window.openDevTools();
// });

// Listen for quit message from render process
ipcMain.on('quit', (evt, arg) => {
    mb.app.quit()
});

ipcMain.on('setColor', (evt, arg) => {
    var color = arg._value;

    console.log(color);

    var hue = color.h;
    var saturation = color.s / 100;
    var lightness = color.v / 100;
    
    // Set up the lifx http api client
    if (lifxApiToken) {
        var client = new lifx({
            bearerToken: lifxApiToken
        });

        // Using promises to set state of lights
        client.setState('all', {
            power: 'on',
            color: 'hue:' + hue + ' saturation:' + saturation,
            brightness: lightness,		
        }).then(console.log, console.error);   
    }
});

ipcMain.on('togglePower', (evt, arg) => {
    // Set up the lifx http api client
    if (lifxApiToken) {
        var client = new lifx({
            bearerToken: lifxApiToken
        });

        client.togglePower().then((result) => {
            console.log(result);

            powerOn = !powerOn;

            if (powerOn) {
                mb.window.webContents.send('powerOn');
            } else {
                mb.window.webContents.send('powerOff');
            }
        }, console.error);
    }
});

ipcMain.on('setApiToken', (evt, apiToken) => {
    // Set up the lifx http api client
    var client = new lifx({
        bearerToken: apiToken
    });

    client.listLights('all', function(err, data) {
        if (err) {
            console.error(err);
            mb.window.webContents.send('displayError', err);
            return;
        }

        // error response from lifx http api
        if (data.error) {
            console.error(data.error);
            mb.window.webContents.send('displayError', data.error);
            return;
        }
        
        // success so save password and go to index page with color picker all set up
        console.log(data);
        global.lifxApiToken = apiToken;

        powerOn = true;

        keytar.setPassword('lifx', 'apitoken', apiToken).then(() => {
            mb.window.setSize(280, 365);
            mb.window.webContents.send('loadview', 'index');

            client.listLights('all', function(err, data) {
                console.log(data);

                if (data[0].power === 'on') {
                    powerOn = true;
                    mb.window.webContents.send('powerOn');
                } else {
                    powerOn = false;
                    mb.window.webContents.send('powerOff');
                }

                var color = {
                    h: data[0].color.hue,
                    s: data[0].color.saturation,
                    l: data[0].brightness
                }

                mb.window.webContents.send('setColor', color);
            });
        });
    });
});
