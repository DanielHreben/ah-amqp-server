exports.default = {
    servers: {
        amqp: function(api) {
            return {
                enabled: true,

                url:        'amqp://localhost',
                durable:    true,
                autoDelete: false,

                queue: 'test_rpc'
            };
        }
    }
};