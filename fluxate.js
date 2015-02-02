var fluxate = {

    createAction: function(options) {
        options = options || {};
        var supportedOptions = [ 'name', 'exec', 'preExecHandlers' ];
        for(option in options) {
            if(supportedOptions.indexOf(option) < 0) throw 'Unsupported option: ' + option;
        }
        var handlers = options.preExecHandlers ? options.preExecHandlers : [];

        return {
            name: options.name ? options.name.toString() : 'unnamed',
            exec: function() {
                for(var i = 0; i < handlers.length; i++) {
                    var shouldHalt = handlers[i].apply(this, arguments);
                    if(shouldHalt) return;
                }
                if(options.exec) options.exec.apply(this, arguments);
            }
        };
    },

    createStore: function() {
        var listeners = [];

        var notifyHandlers = function() {
            listeners.slice().forEach(function(listener) {
                listener.fn.apply(listener.context);
            });
        };

        return {
            onChange: function(listener, context) {
                listeners.push({ fn: listener, context: context || this });
            },
            offChange: function(listener) {
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
                var supportedOptions = [ 'name', 'initValue', 'preCommitHandlers' ];
                for(option in options) {
                    if(supportedOptions.indexOf(option) < 0) throw 'Unsupported option: ' + option;
                }
                var handlers = options.preCommitHandlers ? options.preCommitHandlers : [];
                var value = 'initValue' in options ? options.initValue : null;

                this[options.name] = function() {
                    if(arguments.length === 0) {
                        return value;
                    } else {
                        for(var i = 0; i < handlers.length; i++) {
                            var shouldHalt = handlers[i].call(this, value, arguments[0]);
                            if(shouldHalt) return;
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
