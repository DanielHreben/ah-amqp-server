"use strict";

const {Server, PubSub} = require('yarpc');

let initialize = function(api, options, next) {
    let attributes = {
        canChat:            false,
        logConnections:     false,
        logExits:           false,
        sendWelcomeMessage: false,
        verbs:              [ ]
    };

    let ahServer   = new api.genericServer('amqp', options, attributes);
    let actions    = Object.keys(api.actions.actions);
    let amqpRoutes = api.config.amqpRoutes;


    ahServer.start = function(next) {
        Promise.all([Server.init(options), PubSub.init(options)])
        .then(([rpcServer, pubSub]) => {
            this.rpcServer = rpcServer;

            let handler = action => {
                return params => {
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
                };
            };

            actions.forEach(action => {
                rpcServer.addHandler(action, handler(action));
            });

            amqpRoutes.forEach(route => {
                pubSub.subscribe(route.path, handler(route.action));
            });
        })
        .then(()     => next())
        .catch(error => next(error));
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
