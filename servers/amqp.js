"use strict";

const RPCServer = require('yarpc').Server;

let initialize = function(api, options, next) {
    let attributes = {
        canChat:            false,
        logConnections:     false,
        logExits:           false,
        sendWelcomeMessage: false,
        verbs:              [ ]
    };

    let ahServer = new api.genericServer('amqp', options, attributes);
    let actions  = Object.keys(api.actions.actions);


    ahServer.start = function(next) {
        RPCServer.init(options).then(rpcServer => {
            this.rpcServer = rpcServer;

            actions.forEach(action => {
                rpcServer.addHandler(action, params => {
                    let mergedParams = Object.assign({action: action}, params);

                    return new Promise(resolve => {
                        ahServer.buildConnection({
                            rawConnection: {
                                params: mergedParams,
                                sendResponse: resolve
                            },
                            remoteAddress: '0',
                            remotePort:    '0'
                        });
                    });
                });
            });
        });


        next();
    };

    ahServer.stop = function(next) {
        this.rpcServer.stop().then(() => {
            process.nextTick(() => next());
        });
    };

    ahServer.on('actionComplete', function(data) {
        data.connection.rawConnection.sendResponse(data.response);
    });

    ahServer.on('connection', function(connection) {
        connection.params = connection.rawConnection.params;
        ahServer.processAction(connection);
    });

    next(ahServer);
};


exports.initialize = initialize;