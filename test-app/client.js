"use strict";

const Client = require('yarpc').Client;

Client.init({
    // url: 'amqp://localhost',
    inputQueue: {
        name: 'AHServer:input',
        durable:    false,
        autoDelete: true,
    },
    outputQueue: {
        name: 'AHServer:output',
        durable:    false,
        autoDelete: true,
    }
})
.then(client => {
    return Promise.all([
        client.call('showDocumentation', {a: 1}),
        client.call('status',  {a: 2}),
    ]);
})
.then(response => {
    console.log(response);
});

