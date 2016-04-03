"use strict";

const Client = require('yarpc').Client;

Client.init({url: 'amqp://localhost'}).then(client => {
    return Promise.all([
        client.call('showDocumentation', {a: 1}),
        client.call('status',  {a: 2}),
    ]);
})
.then(response => {
    console.log(response);
});