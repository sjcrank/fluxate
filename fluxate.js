var fluxate = {

    createAction: function(options) {
        options = options || {};
        var handlers = options.preExecHandlers ? options.preExecHandlers : [];

        return {
            name: options.name ? options.name.toString() : 'unnamed',
            exec: function() {
                for(var i = 0; i < handlers.length; i++) {
                    var result = handlers[i].apply(this, arguments);
                    if(!result) return;
                }
                if(options.exec) options.exec.apply(this, arguments);
            }
        };
    },

    createStore: function() {
        var listeners = [];
        var notifying = false;

        var notifyHandlers = function() {
            notifying = true;
            listeners.forEach(function(listener) {
                listener.fn.apply(listener.context);
            });
            notifying = false;
        };

        return {
            onChange: function(listener, context) {
                if(notifying) throw 'Adding a change listener while notifying';
                listeners.push({ fn: listener, context: context || this });
            },
            offChange: function(listener) {
                if(notifying) throw 'Removing a change listener while notifying';
                for(var i = 0; i < listeners.length; i++) {
                    if(listeners[i].fn === listener) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            },
            addProp: function(options) {
                options = options || {};
                if(!options.name) throw 'Property name was not supplied';
                var handlers = options.preCommitHandlers ? options.preCommitHandlers : [];
                var value = 'initValue' in options ? options.initValue : null;

                this[options.name] = function() {
                    if(arguments.length === 0) {
                        return value;
                    } else {
                        if(notifying) throw 'Changing a property while notifying';
                        for(var i = 0; i < handlers.length; i++) {
                            var result = handlers[i].call(this, value, arguments[0]);
                            if(!result) return;
                        }
                        value = arguments[0];
                        notifyHandlers();
                    }
                };
            }
        };
    },

    createStoreWatchMixin: function() {
        var stores = Array.prototype.slice.call(arguments);
        var updateState = function() {
            if(this.isMounted()) {
                this.setState(this.getStateFromStore());
            }
        };
        return {
            componentDidMount: function() {
                for(var i = 0; i < stores.length; i++) {
                    stores[i].onChange(updateState, this);
                }
            },
            componentWillUnmount: function() {
                for(var i = 0; i < stores.length; i++) {
                    stores[i].offChange(updateState, this);
                }
            },
            getInitialState: function() {
                return this.getStateFromStore();
            }
        }
    }
};

// UMD
if(typeof module != 'undefined' && module !== null && module.exports) module.exports = fluxate;
else if(typeof define === 'function' && define.amd) define(function() { return fluxate; });
