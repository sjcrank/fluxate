# Fluxate
Lightweight application architecture library for ReactJS, inspired by Flux

## Installation

Fluxate is available on npm

    npm install fluxate

Fluxate is available on bower

    bower install fluxate
    
## Browser Compatibility

Fluxate is compatible with any [ES5-compliant browser](http://kangax.github.io/compat-table/es5/). You can use [es5-shim](https://github.com/es-shims/es5-shim) for other browsers.

## Usage

Fluxate is an application architecture for building client-side web applications, and is optimized for integration with [Facebook React](http://facebook.github.io/react/). Fluxate applications have three major parts: Stores, Views, and Actions.

### Stores

Stores hold data for use in the application.

```javascript
var tableOptions = fluxate.createStore();
tableOptions.addProp({ name: 'maxRows', initValue: 100 });
tableOptions.addProp({ name: 'sortBy', initValue: 'date' });
tableOptions.addProp({ name: 'visibleColumns', initValue: [ 'date', 'customer', 'amount' ] });
```

Each Store has one or more properties, with functions to get and set their values.

```javascript
tableOptions.maxRows(50);
console.log('Max rows setting is: ' + tableOptions.maxRows());
```

Change listeners may be registered with a Store, and will be notified if any properties of the Store are changed.
```javascript
var changeListener = function() { console.log('the store changed'); };
tableOptions.onChange(changeListener);
tableOptions.sortBy('customer');
tableOptions.offChange(changeListener);
```

Properties may have one or more preCommitHandlers which are functions to be called prior to committing a new value for the property. The handler will be provided the old and new values and is expected to return a truthy value if the commit should be cancelled.
```javascript
tableOptions.addProp({
    name: 'searchText',
    initValue: '',
    preCommitHandlers: [
        function(oldValue, newValue) {
            console.log('changing searchText: ' + oldValue + ' -> ' + newValue);
            if(newValue.length > 100) return false;
        }
    ]
});
```

### Views

Views are React components which keep the DOM synchronized to their internal state. Views listen to Stores for changes, updating their internal state as needed. 

A mixin is provided which will manage registering and unregistering Store listeners, initialize the View state using a provided 'getStateFromStore' function, and update the View state whenever the Stores change using a provided 'getStateFromStore' function.

```javascript
var tableControlBar = React.createClass({
    mixins: [Fluxate.createStoreWatchMixin(customerData)],
    getStateFromStore: function() {
        return {
            customers: customerData.customerList()
        };
    },
    render: function() {
        var customers = this.state.customers.map(function(customer) {
            return (<li>{customer.name} {customer.zip}</li>);
        });
        return (
            <div>
                <h3>Customers</h3>
                <ul>{customers}</ul>
            </div>
        );
    }
});
```

Views respond to user interaction by executing Actions, passing relevant data in the payload of the Action.

```javascript
var tableControlBar = React.createClass({
    mixins: [Fluxate.createStoreWatchMixin(customerDataStore)],
    getStateFromStore: function() {
        return {
            customers: customerDataStore.customerList()
        };
    },
    render: function() {
        var customers = this.state.customers.map(function(customer) {
            return (<li>{customer.name} {customer.zip}</li>);
        });
        return (
            <div>
                <h3>Customers</h3>
                <input type='text' ref='searchField'/>
                <button onClick={this.requestDataLoad}>Load Data</button>
                <ul>{customers}</ul>
            </div>
        );
    },
    requestDataLoad: function() {
        var searchText = this.refs.searchField.getDOMNode().value;
        loadDataAction.exec(searchText);
    }
});
```


### Actions

Actions make network requests and update the property values in Stores.

```javascript
var loadDataAction = fluxate.createAction({
    name: "loadData",
    exec: function(searchText) {
        appStatusStore.message('loading data');
        customerDataStore.customerList([]);
        $.ajax({ url: 'customers?search=' + searchText})
            .done(function(data) {
                customerDataStore.customerList(data);
                appStatusStore.message('complete');
            });
    }
});
```

Actions may have one or more preExecHandlers which are functions to be called prior to executing the Action. Each handler will be provided the arguments that are supplied to the Action and is expected to return a truthy value if the Action should be cancelled.

```javascript
var updateMaxRowsAction = fluxate.createAction({
    name: "loadData",
    exec: tableOptions.maxRows,
    preExecHandlers: [
        function(newValue) {
            console.log('request to update max rows to: ' + newValue);
            if(newValue !== parseInt(newValue, 10) || newValue <= 0) return false;
        }
    ]
});
```

## Colophon

Fluxate is licensed under the [MIT License](http://opensource.org/licenses/MIT).

Inspired by:

* [Facebook Flux](http://facebook.github.io/flux/)
* [Fluxxor](http://fluxxor.com/)
* [RefluxJS](https://github.com/spoike/refluxjs)
