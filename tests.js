var assert = require('assert');
var fluxate = require('./fluxate');


//**********************************
// createAction tests
//**********************************

describe('createAction', function() {
    it('should create an action even with missing options', function() {
        var action = fluxate.createAction();
        assert.equal('unnamed', action.name);
        assert.doesNotThrow(function() { action.exec(); });
    });
    it('should create an action even with undefined name, exec, and preExecHandlers', function() {
        var action = fluxate.createAction({});
        assert.equal('unnamed', action.name);
        assert.doesNotThrow(function() { action.exec(); });
    });
    it('should create action having supplied actionName', function() {
        var action = fluxate.createAction({ name: "theName"});
        assert.equal('theName', action.name);
    });
    it('should create action that calls the supplied exec function', function() {
        var isCalled = false;
        var action = fluxate.createAction({
            name: "theName",
            exec: function() {
                isCalled = true;
            }
        });
        action.exec();
        assert.ok(isCalled);
    });
    it('should pass arguments to the supplied exec function', function() {
        var action = fluxate.createAction({
            name: "theName",
            exec: function() {
                assert.equal(2, arguments.length);
                assert.equal('a', arguments[0]);
                assert.equal(1, arguments[1]);
            }
        });
        action.exec('a', 1);
    });
    it('should call preExecHandlers in order, prior to exec', function() {
        var idx = 0;
        var action = fluxate.createAction({
            name: "theName",
            exec: function() {
                assert.equal(2, idx);
                idx++;
            },
            preExecHandlers: [
                function() {
                    assert.equal(0, idx);
                    idx++;
                    return true;
                },
                function() {
                    assert.equal(1, idx);
                    idx++;
                    return true;
                }
            ]
        });
        action.exec();
    });
    it('should stop if a preExecHandler returns false', function() {
        var idx = 0;
        var action = fluxate.createAction({
            name: "theName",
            exec: function() {
                assert.fail('called exec', 'did not call exec', '', '!=');
            },
            preExecHandlers: [
                function() {
                    return false;
                },
                function() {
                    assert.fail('called handler', 'did not call handler', '', '!=');
                    return true;
                }
            ]
        });
        action.exec();
    });
    it('should pass arguments to the supplied preExecHandlers', function() {
        var action = fluxate.createAction({
            name: "theName",
            exec: function() {
                assert.equal(2, arguments.length);
                assert.equal('a', arguments[0]);
                assert.equal(1, arguments[1]);
            },
            preExecHandlers: [
                function() {
                    assert.equal(2, arguments.length);
                    assert.equal('a', arguments[0]);
                    assert.equal(1, arguments[1]);
                    return true;
                }
            ]
        });
        action.exec('a', 1);
    });
});


//**********************************
// createStore tests
//**********************************

describe('createStore', function() {
    var store;
    beforeEach(function() {
        store = fluxate.createStore();
    });

    it('should throw an error if options are missing', function() {
        assert.throws(function() {
            store.addProp();
        });
    });
    it('should throw an error if name is missing', function() {
        assert.throws(function() {
            store.addProp({ initValue: 12 });
        });
    });
    it('should create a property with supplied name and initial value', function() {
        store.addProp({ name: 'hello', initValue: 12 });
        assert.equal(12, store.hello());
        store.hello(4);
        assert.equal(4, store.hello());
    });
    it('should create a property with null value in case initial value is not supplied', function() {
        store.addProp({ name: 'hello' });
        assert.equal(null, store.hello());
    });
    it('should accept falsy values for a property', function() {
        store.addProp({ name: 'hello', initValue: 12 });
        store.hello(null);
        assert.equal(null, store.hello());
        store.hello(undefined);
        assert.equal(undefined, store.hello());
        store.hello('');
        assert.equal('', store.hello());
        store.hello({});
        assert.deepEqual({}, store.hello());
        store.hello(false);
        assert.equal(false, store.hello());
        store.hello(NaN);
        assert.ok(isNaN(store.hello()));
        store.hello(0);
        assert.equal(0, store.hello());
    });
    it('should accept falsy values as initial value for a property', function() {
        store.addProp({ name: 'prop1', initValue: null });
        assert.equal(null, store.prop1());
        store.addProp({ name: 'prop2', initValue: undefined });
        assert.equal(null, store.prop2());
        store.addProp({ name: 'prop3', initValue: '' });
        assert.equal('', store.prop3());
        store.addProp({ name: 'prop4', initValue: {} });
        assert.deepEqual({}, store.prop4());
        store.addProp({ name: 'prop5', initValue: false });
        assert.equal(false, store.prop5());
        store.addProp({ name: 'prop6', initValue: NaN });
        assert.ok(isNaN(store.prop6()));
        store.addProp({ name: 'prop7', initValue: 0 });
        assert.equal(0, store.prop7());
    });
    it('should support multiple independent properties', function() {
        store.addProp({ name: 'hello', initValue: 12 });
        assert.equal(12, store.hello());
        store.addProp({ name: 'world', initValue: 'whatever' });
        assert.equal('whatever', store.world());

        store.hello(4);
        assert.equal(4, store.hello());
        store.world('ok');
        assert.equal('ok', store.world());
    });
    it('should notify change handlers on property change', function() {
        var idx1 = 0;
        var idx2 = 0;
        var changeHandler1 = function() { idx1++; };
        var changeHandler2 = function() { idx2++; };
        store.onChange(changeHandler1);
        store.onChange(changeHandler2);

        store.addProp({ name: 'hello', initValue: 12 });
        store.hello(4);
        assert.equal(1, idx1);
        assert.equal(1, idx2);
        store.hello(9);
        assert.equal(2, idx1);
        assert.equal(2, idx2);

        store.offChange(changeHandler1);
        store.hello(7);
        assert.equal(2, idx1);
        assert.equal(3, idx2);
    });
    it('should throw error if adding change handlers while committing', function() {
        store.addProp({ name: 'hello', initValue: 12 });
        store.onChange(function() {
            store.onChange(function() {});
        });
        assert.throws(function() {
            store.hello(4);
        });
    });
    it('should throw error if removing change handlers while committing', function() {
        store.addProp({ name: 'hello', initValue: 12 });
        store.onChange(function() {
            store.offChange(function() {});
        });
        assert.throws(function() {
            store.hello(4);
        });
    });
    it('should throw error if changing property value while committing', function() {
        store.addProp({ name: 'hello', initValue: 12 });
        store.onChange(function() {
            store.hello(8);
        });
        assert.throws(function() {
            store.hello(4);
        });
    });
    it('should call preCommitHandlers in order, prior to committing', function() {
        var idx = 0;
        store.onChange(function() {
            assert.equal(2, idx);
        });
        store.addProp({
            name: 'hello',
            initValue: 12,
            preCommitHandlers: [
                function() {
                    assert.equal(0, idx);
                    idx++;
                    return true;
                },
                function() {
                    assert.equal(1, idx);
                    idx++;
                    return true;
                }
            ]
        });
        store.hello(8);
    });
    it('should stop if a preCommitHandler returns false', function() {
        var idx = 0;
        store.onChange(function() {
            assert.fail('called change handler', 'did not call change handler', '', '!=');
        });
        store.addProp({
            name: 'hello',
            initValue: 12,
            preCommitHandlers: [
                function() {
                    return false;
                },
                function() {
                    assert.fail('called handler', 'did not call handler', '', '!=');
                    return true;
                }
            ]
        });
        store.hello(8);
        assert.equal(12, store.hello());
    });
    it('should pass old value and new value to the supplied preCommitHandlers', function() {
        store.addProp({
            name: 'hello',
            initValue: 12,
            preCommitHandlers: [
                function() {
                    assert.equal(2, arguments.length);
                    assert.equal(12, arguments[0]);
                    assert.equal(8, arguments[1]);
                    return true;
                }
            ]
        });
        store.hello(8);
    });
});


//**********************************
// createStoreWatchMixin tests
//**********************************

describe('createStoreWatchMixin', function() {
    var store1, store2, mixin;
    beforeEach(function() {
        store1 = fluxate.createStore();
        store1.addProp({ name: 'hello', initValue: 12 });
        store2 = fluxate.createStore();
        store2.addProp({ name: 'world', initValue: 'ok' });

        mixin = fluxate.createStoreWatchMixin(store1, store2);
        mixin.getStateFromStore = function() {
            return {
                helloState: store1.hello(),
                worldState: store2.world()
            };
        };
        mixin.isMounted = function() {
            return true;
        };
    });
    it('initial state matches stateFromStore', function() {
        var state = mixin.getInitialState();
        assert.deepEqual({ helloState: 12, worldState: 'ok' }, state);
    });
    it('setState is updated when stores change', function() {
        var updatedValue = null;
        mixin.setState = function(value) {
            updatedValue = value;
        };

        mixin.componentDidMount();
        store1.hello(14);
        assert.deepEqual({ helloState: 14, worldState: 'ok' }, updatedValue);
        store2.world('tomorrow');
        assert.deepEqual({ helloState: 14, worldState: 'tomorrow' }, updatedValue);
    });
    it('setState is not updated before component mounts', function() {
        var updatedValue = null;
        mixin.setState = function(value) {
            updatedValue = value;
        };

        store1.hello(14);
        assert.equal(null, updatedValue);
    });
    it('setState is not updated after unmount', function() {
        var updatedValue = null;
        mixin.setState = function(value) {
            updatedValue = value;
        };

        mixin.componentDidMount();
        store1.hello(14);
        assert.deepEqual({ helloState: 14, worldState: 'ok' }, updatedValue);
        mixin.componentWillUnmount();
        store2.world('tomorrow');
        assert.deepEqual({ helloState: 14, worldState: 'ok' }, updatedValue);
    });
});