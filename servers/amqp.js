"use strict";

const uuid = require('node-uuid');
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
    let amqpRoutes = api.config.amqpRoutes || [];
    let handlers   = {};

    ahServer._buildHandler = function(action) {
        return params => {
            let mergedParams = Object.assign({action: action}, params);

            let id = uuid.v1();

            let promise = new Promise(resolve => {
                handlers[id] = resolve;
            });

            this.buildConnection({
                rawConnection: {
                    params:    mergedParams,
                    handlerId: id,
                },
                remoteAddress: '0',
                remotePort:    '0'
            });

            return promise;
        };
    };

    ahServer.start = function(next) {
        Promise.all([Server.init(options), PubSub.init(options)])
        .then(([rpcServer, pubSub]) => {
            this.rpcServer = rpcServer;

            actions.forEach(action => {
                rpcServer.addHandler(action, this._buildHandler(action));
            });

            amqpRoutes.forEach(route => {
                pubSub.subscribe(route.path, this._buildHandler(route.action));
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

    ahServer.goodbye = function(){
      // disconnect handlers
    };

    ahServer.on('actionComplete', function(data) {
        let handlerId = data.connection.rawConnection.handlerId;
        handlers[handlerId](data.response);
        delete handlers[handlerId];
        data.connection.destroy();

    });

    ahServer.on('connection', function(connection) {
        connection.params = connection.rawConnection.params;
        ahServer.processAction(connection);
    });

    next(ahServer);
};


exports.initialize = initialize;
