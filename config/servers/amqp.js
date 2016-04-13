exports.default = {
    servers: {
        amqp: function(api) {
            return {
                enabled: true,

                url:        'amqp://localhost',
                inputQueue: {
                    name: 'AHServer:input',
                    durable:    false,
                    autoDelete: false,
                }
            };
        }
    }
};