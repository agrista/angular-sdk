var sdkInterfaceMapApp = angular.module('ag.sdk.interface.map', ['ag.sdk.utilities', 'ag.sdk.id', 'ag.sdk.config', 'ag.sdk.geospatial', 'ag.sdk.library']);

sdkInterfaceMapApp.provider('mapMarkerHelper', ['underscore', function (underscore) {
    var _createMarker = function (name, state, options) {
        return underscore.defaults(options || {}, {
            iconUrl: 'img/icons/' + name + '.' + (state ? state : 'default') + '.png',
            shadowUrl: 'img/icons/' + name + '.shadow.png',
            iconSize: [48, 48],
            iconAnchor: [22, 42],
            shadowSize: [73, 48],
            shadowAnchor: [22, 40],
            labelAnchor: [12, -24]
        });
    };

    var _getMarker = this.getMarker = function (name, state, options) {
        if (typeof state == 'object') {
            options = state;
            state = 'default';
        }

        return  _createMarker(name, state, options);
    };

    var _getMarkerStates = this.getMarkerStates = function (name, states, options) {
        var markers = {};

        if (typeof name === 'string') {
            angular.forEach(states, function(state) {
                markers[state] = _createMarker(name, state, options);
            });
        }

        return markers;
    };

    this.$get = function() {
        return {
            getMarker: _getMarker,
            getMarkerStates: _getMarkerStates
        }
    };
}]);

sdkInterfaceMapApp.provider('mapStyleHelper', ['mapMarkerHelperProvider', function (mapMarkerHelperProvider) {
    var _markerIcons = {
        asset: mapMarkerHelperProvider.getMarkerStates('asset', ['default', 'success', 'error']),
        zone: mapMarkerHelperProvider.getMarkerStates('marker', ['default', 'success', 'error'])
    };

    var _mapStyles = {
        foreground: {
            district: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#0094D6",
                    fillOpacity: 0.6
                }
            },
            farmland: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "blue",
                    fillOpacity: 0.3
                }
            },
            field: {
                icon: 'success',
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.8
                }
            },
            crop: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.8
                }
            },
            improvement: {
                icon: 'success',
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.8
                }
            },
            cropland: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.8
                }
            },
            pasture: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.8
                }
            },
            'permanent crop': {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.8
                }
            },
            plantation: {
                icon: _markerIcons.asset.success,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.8
                }
            },
            zone: {
                icon: _markerIcons.zone.success,
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.8
                }
            },
            farmgate: {
                icon: 'success'
            },
            homestead: {
                icon: 'success'
            },
            search: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#f7b2bf",
                    fillOpacity: 0.8,
                    dashArray: "5,5"
                }
            }
        },
        background: {
            district: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#0094D6",
                    fillOpacity: 0.2
                }
            },
            farmland: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "blue",
                    fillOpacity: 0.1
                }
            },
            field: {
                icon: 'default',
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.4
                }
            },
            crop: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.4
                }
            },
            improvement: {
                icon: 'default',
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
                }
            },
            cropland: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.4
                }
            },
            pasture: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.4
                }
            },
            'permanent crop': {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.4
                }
            },
            plantation: {
                icon: _markerIcons.asset.default,
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.4
                }
            },
            zone: {
                icon: _markerIcons.zone.default,
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.5,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
                }
            },
            farmgate: {
                icon: 'default'
            },
            homestead: {
                icon: 'default',
                label: {
                    message: 'Homestead'
                }
            }
        }
    };

    var _getStyle = this.getStyle = function (composition, layerName, label) {
        var mapStyle = (_mapStyles[composition] && _mapStyles[composition][layerName] ? angular.copy(_mapStyles[composition][layerName]) : {});

        if (typeof mapStyle.icon == 'string') {
            if (_markerIcons[layerName] === undefined) {
                _markerIcons[layerName] = mapMarkerHelperProvider.getMarkerStates(layerName, ['default', 'success', 'error']);
            }

            mapStyle.icon = _markerIcons[layerName][mapStyle.icon];
        }

        if (typeof label == 'object') {
            mapStyle.label = label;
        }

        return mapStyle;
    };

    var _setStyle = this.setStyle = function(composition, layerName, style) {
        _mapStyles[composition] = _mapStyles[composition] || {};
        _mapStyles[composition][layerName] = style;
    };

    this.$get = function() {
        return {
            getStyle: _getStyle,
            setStyle: _setStyle
        }
    };
}]);

/**
 * Maps
 */
sdkInterfaceMapApp.provider('mapboxService', ['underscore', function (underscore) {
    var _defaultConfig = {
        init: {
            delay: 200
        },
        options: {
            attributionControl: true,
            layersControl: true,
            scrollWheelZoom: false,
            zoomControl: true
        },
        layerControl: {
            baseTile: 'Agriculture',
            baseLayers: {
                'Agriculture': {
                    tiles: 'agrista.f9f5628d',
                    type: 'mapbox'
                },
                'Satellite': {
                    tiles: 'agrista.a7235891',
                    type: 'mapbox'
                },
                'Hybrid': {
                    tiles: 'agrista.01e3fb18',
                    type: 'mapbox'
                },
                'Light': {
                    tiles: 'agrista.e7367e07',
                    type: 'mapbox'
                },
                'Production Regions': {
                    tiles: 'agrista.87ceb2ab',
                    type: 'mapbox'
                }
            },
            overlays: {}
        },
        controls: {},
        events: {},
        view: {
            coordinates: [-28.691, 24.714],
            zoom: 6
        },
        bounds: {},
        leafletLayers: {},
        layers: {},
        geojson: {}
    };

    var _instances = {};
    
    this.config = function (options) {
        _defaultConfig = underscore.defaults(options || {}, _defaultConfig);
    };

    this.$get = ['$rootScope', '$timeout', 'objectId', 'safeApply', function ($rootScope, $timeout, objectId, safeApply) {
        /**
        * @name MapboxServiceInstance
        * @param id
        * @constructor
        */
        function MapboxServiceInstance(id, options) {
            var _this = this;

            _this._id = id;
            _this._ready = false;
            _this._options = options;
            _this._show = _this._options.show || false;

            _this._config = angular.copy(_defaultConfig);
            _this._requestQueue = [];

            $rootScope.$on('mapbox-' + _this._id + '::init', function () {
                $timeout(function () {
                    _this.dequeueRequests();
                    _this._ready = true;
                }, _this._config.init.delay || 0);
            });

            $rootScope.$on('mapbox-' + _this._id + '::destroy', function () {
                _this._ready = false;

                if (_this._options.persist !== true) {
                    _this._config = angular.copy(_defaultConfig);
                }
            });
        }

        MapboxServiceInstance.prototype = {
            getId: function () {
                return this._id;
            },
            isReady: function () {
                return this._ready;
            },
            
            /*
             * Reset
             */
            reset: function () {
                this._config = angular.copy(_defaultConfig);

                $rootScope.$broadcast('mapbox-' + this._id + '::reset');
            },
            clearLayers: function () {
                this.removeOverlays();
                this.removeGeoJSON();
                this.removeLayers();
            },

            /*
             * Queuing requests
             */
            enqueueRequest: function (event, data, handler) {
                handler = handler || angular.noop;

                if (this._ready) {
                    $rootScope.$broadcast(event, data);

                    handler();
                } else {
                    this._requestQueue.push({
                        event: event,
                        data: data,
                        handler: handler
                    });
                }
            },
            dequeueRequests: function () {
                if (this._requestQueue.length) {
                    do {
                        var request = this._requestQueue.shift();

                        $rootScope.$broadcast(request.event, request.data);

                        request.handler();
                    } while(this._requestQueue.length);
                }
            },

            /*
             * Display
             */
            shouldShow: function() {
                return this._show;
            },
            hide: function() {
                var _this = this;

                this.enqueueRequest('mapbox-' + this._id + '::hide', {}, function () {
                    _this._show = false;
                });
            },
            show: function() {
                var _this = this;

                this.enqueueRequest('mapbox-' + this._id + '::show', {}, function () {
                    _this._show = true;
                });
            },
            invalidateSize: function() {
                this.enqueueRequest('mapbox-' + this._id + '::invalidate-size', {});
            },

            /*
             * Options
             */
            getOptions: function () {
                return this._config.options;
            },
            setOptions: function (options) {
                var _this = this;

                angular.forEach(options, function(value, key) {
                    _this._config.options[key] = value;
                });
            },

            /*
             * Map
             */
            getMapCenter: function(handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-center', handler);
            },
            getMapBounds: function(handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-bounds', handler);
            },
            getMapControl: function(control, handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-control', {
                    control: control,
                    handler: handler
                });
            },

            /*
             * Layer Control
             */
            getBaseTile: function () {
                return this._config.layerControl.baseTile;
            },
            setBaseTile: function (tile) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::set-basetile', tile, function () {
                    _this._config.layerControl.baseTile = tile;
                });
            },

            getBaseLayers: function () {
                return this._config.layerControl.baseLayers;
            },
            setBaseLayers: function (layers) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::set-baselayers', layers, function () {
                    _this._config.layerControl.baseLayers = layers;
                });
            },
            addBaseLayer: function (name, layer, show) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::add-baselayer', {
                    name: name,
                    layer: layer,
                    show: show
                }, function () {
                    _this._config.layerControl.baseLayers[name] = layer;
                });
            },

            getOverlays: function () {
                return this._config.layerControl.overlays;
            },
            addOverlay: function (layerName, name) {
                if (layerName && this._config.layerControl.overlays[layerName] == undefined) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + _this._id + '::add-overlay', {
                        layerName: layerName,
                        name: name || layerName
                    }, function () {
                        _this._config.layerControl.overlays[layerName] = name;
                    });
                }
            },
            removeOverlay: function (layerName) {
                if (layerName && this._config.layerControl.overlays[layerName]) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-overlay', layerName, function () {
                        delete _this._config.layerControl.overlays[layerName];
                    });
                }
            },
            removeOverlays: function () {
                var _this = this;
                
                angular.forEach(_this._config.layerControl.overlays, function(overlay, name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-overlay', name, function () {
                        delete _this._config.layerControl.overlays[name];
                    });
                });
            },

            /*
             * Controls
             */
            getControls: function () {
                return this._config.controls;
            },
            addControl: function (controlName, options) {
                var _this = this;
                var control = {
                    name: controlName,
                    options: options
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::add-control', control, function () {
                    _this._config.controls[controlName] = control;
                });
            },
            showControls: function () {
                this.enqueueRequest('mapbox-' + this._id + '::show-controls');
            },
            hideControls: function () {
                this.enqueueRequest('mapbox-' + this._id + '::hide-controls');
            },
            removeControl: function (control) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::remove-control', control, function () {
                    delete _this._config.controls[control];
                });
            },

            /*
             * Event Handlers
             */
            getEventHandlers: function () {
                return this._config.events;
            },
            addEventHandler: function (events, handler) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function (event) {
                    _this.removeEventHandler(event);

                    var eventHandler = (event !== 'click' ? handler : function (e) {
                        var clickLocation = e.originalEvent.x + ',' + e.originalEvent.y;

                        if (!_this.lastClick || _this.lastClick !== clickLocation) {
                            safeApply(function () {
                                handler(e);
                            });
                        }

                        _this.lastClick = clickLocation;
                    });

                    _this.enqueueRequest('mapbox-' + _this._id + '::add-event-handler', {
                        event: event,
                        handler: eventHandler
                    }, function () {
                        _this._config.events[event] = eventHandler;
                    });
                });
            },
            removeEventHandler: function (events) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function (event) {
                    if (_this._config.events[event] !== undefined) {
                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-event-handler', {
                            event: event,
                            handler: _this._config.events[event]
                        }, function () {
                            delete _this._config.events[event];
                        });
                    }
                });
            },
            addLayerEventHandler: function (event, layer, handler) {
                var _this = this;

                layer.on(event, (event !== 'click' ? handler : function (e) {
                    var clickLocation = e.originalEvent.x + ',' + e.originalEvent.y;

                    if (!_this.lastClick || _this.lastClick !== clickLocation) {
                        safeApply(function () {
                            handler(e);
                        });
                    }

                    _this.lastClick = clickLocation;
                }));
            },

            /*
             * View
             */
            getView: function () {
                return {
                    coordinates: this._config.view.coordinates,
                    zoom: this._config.view.zoom
                }
            },
            setView: function (coordinates, zoom) {
                if (coordinates instanceof Array) {
                    var _this = this;
                    var view = {
                        coordinates: coordinates,
                        zoom: zoom || _this._config.view.zoom
                    };

                    _this.enqueueRequest('mapbox-' + _this._id + '::set-view', view, function () {
                        _this._config.view = view;
                    });
                }
            },
            getBounds: function () {
                return this._config.bounds;
            },
            setBounds: function (coordinates, options) {
                var _this = this;
                var bounds = {
                    coordinates: coordinates,
                    options: options || {
                        reset: false
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::set-bounds', bounds, function () {
                    _this._config.bounds = bounds;
                });
            },
            zoomTo: function (coordinates, zoom, options) {
                this.enqueueRequest('mapbox-' + this._id + '::zoom-to', {
                    coordinates: coordinates,
                    zoom: zoom,
                    options: options
                });
            },

            /*
             * Layers
             */
            createLayer: function (name, type, options, handler) {
                if (typeof options === 'function') {
                    handler = options;
                    options = {};
                }

                var _this = this;
                var layer = {
                    name: name,
                    type: type,
                    options: options,
                    handler: function (layer) {
                        _this._config.leafletLayers[name] = layer;

                        if (typeof handler === 'function') {
                            handler(layer);
                        }
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::create-layer', layer, function () {
                    _this._config.layers[name] = layer;
                });
            },
            getLayer: function (name) {
                return this._config.leafletLayers[name];
            },
            getLayers: function () {
                return this._config.layers;
            },
            addLayer: function (name, layer) {
                var _this = this;
                _this.enqueueRequest('mapbox-' + _this._id + '::add-layer', name, function () {
                    _this._config.leafletLayers[name] = layer;
                });
            },
            removeLayer: function (names) {
                if ((names instanceof Array) === false) names = [names];

                var _this = this;

                angular.forEach(names, function (name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', name, function () {
                        delete _this._config.layers[name];
                        delete _this._config.leafletLayers[name];
                    });
                });
            },
            removeLayers: function () {
                var _this = this;
                
                angular.forEach(this._config.layers, function(layer, name) {
                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', name, function () {
                        delete _this._config.layers[name];
                        delete _this._config.leafletLayers[name];
                    });
                });
            },
            showLayer: function (name) {
                this.enqueueRequest('mapbox-' + this._id + '::show-layer', name);
            },
            hideLayer: function (name) {
                this.enqueueRequest('mapbox-' + this._id + '::hide-layer', name);
            },
            fitLayer: function (name, options) {
                this.enqueueRequest('mapbox-' + this._id + '::fit-layer', {
                    name: name,
                    options: options || {
                        reset: false
                    }
                });
            },

            /*
             * GeoJson
             */
            getGeoJSON: function () {
                return this._config.geojson;
            },
            getGeoJSONFeature: function (layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    return this._config.geojson[layerName][featureId];
                }

                return null;
            },
            getGeoJSONLayer: function (layerName) {
                if (this._config.geojson[layerName]) {
                    return this._config.geojson[layerName];
                }

                return null;
            },
            addGeoJSON: function(layerName, geojson, options, properties, onAddCallback) {
                if (typeof properties == 'function') {
                    onAddCallback = properties;
                    properties = {};
                }

                var _this = this;

                properties = underscore.defaults(properties || {},  {
                    featureId: objectId().toString()
                });

                var data = {
                    layerName: layerName,
                    geojson: geojson,
                    options: options,
                    properties: properties,
                    handler: function (layer, feature, featureLayer) {
                        _this._config.leafletLayers[layerName] = layer;
                        _this._config.leafletLayers[properties.featureId] = featureLayer;

                        if (typeof onAddCallback == 'function') {
                            onAddCallback(feature, featureLayer);
                        }
                    }
                };

                _this.enqueueRequest('mapbox-' + _this._id + '::add-geojson', data, function () {
                    _this._config.geojson[layerName] = _this._config.geojson[layerName] || {};
                    _this._config.geojson[layerName][properties.featureId] = data;
                });

                return properties.featureId;
            },
            addPhotoMarker: function(layerName, geojson, options, properties, onAddCallback) {
                if (typeof properties == 'function') {
                    onAddCallback = properties;
                    properties = {};
                }

                var _this = this;

                properties = underscore.defaults(properties || {},  {
                    featureId: objectId().toString()
                });

                var data = {
                    layerName: layerName,
                    geojson: geojson,
                    options: options,
                    properties: properties,
                    handler: function (layer, feature, featureLayer) {
                        _this._config.leafletLayers[layerName] = layer;

                        if (typeof onAddCallback == 'function') {
                            onAddCallback(feature, featureLayer);
                        }
                    }
                };

                data.properties.isMedia = true;

                _this.enqueueRequest('mapbox-' + _this._id + '::add-photo-marker', data, function () {
                    _this._config.geojson[layerName] = _this._config.geojson[layerName] || {};
                    _this._config.geojson[layerName][properties.featureId] = data;
                });

                return properties.featureId;
            },
            removeGeoJSONFeature: function(layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    var _this = this;
                    _this.enqueueRequest('mapbox-' + this._id + '::remove-geojson-feature', this._config.geojson[layerName][featureId], function () {
                        delete _this._config.geojson[layerName][featureId];
                    });
                }
            },
            removeGeoJSONLayer: function(layerNames) {
                if ((layerNames instanceof Array) === false) layerNames = [layerNames];

                var _this = this;

                angular.forEach(layerNames, function(layerName) {
                    if (_this._config.geojson[layerName]) {
                        angular.forEach(_this._config.geojson[layerName], function(childLayer, childName) {
                            _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', childName, function () {
                                delete _this._config.leafletLayers[childName];
                                delete _this._config.geojson[layerName][childName];
                            });
                        });

                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-geojson-layer', layerName, function () {
                            delete _this._config.leafletLayers[layerName];
                            delete _this._config.geojson[layerName];
                        });
                    }
                });
            },
            removeGeoJSON: function() {
                var _this = this;

                angular.forEach(_this._config.geojson, function(layer, name) {
                    angular.forEach(layer, function(childLayer, childName) {
                        _this.enqueueRequest('mapbox-' + _this._id + '::remove-layer', childName, function () {
                            delete _this._config.leafletLayers[childName];
                            delete _this._config.geojson[name][childName];
                        });
                    });

                    _this.enqueueRequest('mapbox-' + _this._id + '::remove-geojson-layer', name, function () {
                        delete _this._config.leafletLayers[name];
                        delete _this._config.geojson[name];
                    });
                });
            },

            /*
             * Editing
             */
            editingOn: function (layerName, controls, controlOptions, styleOptions, addLayer) {
                if (typeof controlOptions == 'string') {
                    controlOptions = {
                        exclude: (controlOptions == 'exclude')
                    }
                }

                this.enqueueRequest('mapbox-' + this._id + '::edit-on', {layerName: layerName, controls: controls, controlOptions: controlOptions, styleOptions: styleOptions, addLayer: addLayer});
            },
            editingUpdate: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-update');
            },
            editingClear: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-clear');
            },
            editingOff: function () {
                this.enqueueRequest('mapbox-' + this._id + '::edit-off');
            },

            /*
             * Picking
             */
            pickPortionOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-portion-on');
            },
            pickDistrictOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-district-on');
            },
            pickFieldOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-field-on');
            },
            defineFarmOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-on');
            },
            defineServiceAreaOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-service-area-on');
            },
            defineFieldGroupOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-field-group-on');
            },
            featureClickOn: function() {
                this.enqueueRequest('mapbox-' + this._id + '::feature-click-on');
            },
            pickPortionOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-portion-off');
            },
            pickDistrictOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-district-off');
            },
            pickFieldOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::pick-field-off');
            },
            defineFarmOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-off');
            },
            defineServiceAreaOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-service-area-off');
            },
            defineFieldGroupOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-field-group-off');
            },
            featureClickOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::feature-click-off');
            },

            /*
             * Sidebar
             */
            enableSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::enable-sidebar');
            },
            showSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-show');
            },
            hideSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-hide');
            },
            toggleSidebar: function() {
                this.enqueueRequest('mapbox-' + this._id + '::sidebar-toggle');
            }
        };

        /*
         * Get or create a MapboxServiceInstance
         */
        return function (id, options) {
            options = options || {};

            if (_instances[id] === undefined) {
                _instances[id] = new MapboxServiceInstance(id, options);
            }

            if (options.clean === true) {
                _instances[id].reset();
            }

            return _instances[id];
        };
    }];
}]);

/**
 * mapbox
 */
sdkInterfaceMapApp.directive('mapbox', ['$rootScope', '$http', '$log', '$timeout', 'configuration', 'mapboxService', 'geoJSONHelper', 'mapStyleHelper', 'objectId', 'underscore', function ($rootScope, $http, $log, $timeout, configuration, mapboxService, geoJSONHelper, mapStyleHelper, objectId, underscore) {
    var _instances = {};
    
    function Mapbox(attrs, scope) {
        var _this = this;
        _this._id = attrs.id;

        _this._optionSchema = {};
        _this._editing = false;
        _this._editableLayer;
        _this._editableFeature = L.featureGroup();
        _this._featureClickable;

        _this._geoJSON = {};
        _this._layers = {};
        _this._controls = {};
        _this._layerControls = {
            baseTile: '',
            baseLayers: {},
            overlays: {}
        };
        _this._draw = {
            exclude: false,
            addLayer: true,
            options: {},
            controls: {}
        };

        // Init
        attrs.delay = attrs.delay || 0;

        $timeout(function () {
            _this.mapInit();
            _this.addListeners(scope);

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::init', _this._map);
        }, attrs.delay);
    }

    /*
     * Config
     */
    Mapbox.prototype.mapInit = function() {
        // Setup mapboxServiceInstance
        var _this = this;
        _this._mapboxServiceInstance = mapboxService(_this._id);

        // Setup map
        var view = _this._mapboxServiceInstance.getView();
        var options = _this._mapboxServiceInstance.getOptions();

        L.mapbox.accessToken = options.accessToken;

        _this._map = L.map(_this._id, options).setView(view.coordinates, view.zoom);

        _this._map.whenReady(function () {
            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::ready', _this._map);
        });

        _this._map.on('baselayerchange', function (event) {
            _this._layerControls.baseTile = event.name;
        });

        _this._editableFeature = L.featureGroup();
        _this._editableFeature.addTo(_this._map);

        _this.setEventHandlers(_this._mapboxServiceInstance.getEventHandlers());
        _this.addControls(_this._mapboxServiceInstance.getControls());
        _this.setBounds(_this._mapboxServiceInstance.getBounds());
        _this.resetLayers(_this._mapboxServiceInstance.getLayers());
        _this.resetGeoJSON(_this._mapboxServiceInstance.getGeoJSON());
        _this.resetLayerControls(_this._mapboxServiceInstance.getBaseTile(), _this._mapboxServiceInstance.getBaseLayers(), _this._mapboxServiceInstance.getOverlays());

        _this._map.on('draw:drawstart', _this.onDrawStart, _this);
        _this._map.on('draw:editstart', _this.onEditStart, _this);
        _this._map.on('draw:deletestart', _this.onDrawStart, _this);
        _this._map.on('draw:drawstop', _this.onDrawStop, _this);
        _this._map.on('draw:editstop', _this.onEditStop, _this);
        _this._map.on('draw:deletestop', _this.onDrawStop, _this);
    };

    Mapbox.prototype.addListeners = function (scope) {
        scope.hidden = !this._mapboxServiceInstance.shouldShow();
        
        var _this = this;
        var id = this._mapboxServiceInstance.getId();

        scope.$on('mapbox-' + id + '::get-center', function (event, handler) {
            if (typeof handler === 'function') {
                handler(_this._map.getCenter());
            }
        });

        scope.$on('mapbox-' + id + '::get-bounds', function (event, handler) {
            if (typeof handler === 'function') {
                handler(_this._map.getBounds());
            }
        });

        scope.$on('mapbox-' + id + '::get-control', function (event, args) {
            if (typeof args.handler === 'function') {
                args.handler(_this._controls[args.control]);
            }
        });

        // Destroy mapbox directive
        scope.$on('$destroy', function () {
            delete _instances[id];

            _this.mapDestroy();

            _this.broadcast('mapbox-' + id + '::destroy');
        });

        // Layer Controls
        scope.$on('mapbox-' + id + '::set-basetile', function (event, args) {
            _this.setBaseTile(args);
        });

        scope.$on('mapbox-' + id + '::set-baselayers', function (event, args) {
            _this.setBaseLayers(args);
        });

        scope.$on('mapbox-' + id + '::add-baselayer', function (event, args) {
            _this.addBaseLayer(args.layer, args.name, args.show);
        });

        scope.$on('mapbox-' + id + '::add-overlay', function (event, args) {
            _this.addOverlay(args.layerName, args.name);
        });

        scope.$on('mapbox-' + id + '::remove-overlay', function (event, args) {
            _this.removeOverlay(args);
        });

        // Controls
        scope.$on('mapbox-' + id + '::add-control', function (event, args) {
            _this.addControls({control: args});
        });

        scope.$on('mapbox-' + id + '::remove-control', function (event, args) {
            _this.removeControl(args);
        });

        scope.$on('mapbox-' + id + '::show-controls', function (event, args) {
            _this.showControls(args);
        });

        scope.$on('mapbox-' + id + '::hide-controls', function (event, args) {
            _this.hideControls(args);
        });

        // Event Handlers
        scope.$on('mapbox-' + id + '::add-event-handler', function (event, args) {
            _this.addEventHandler(args.event, args.handler);
        });

        scope.$on('mapbox-' + id + '::remove-event-handler', function (event, args) {
            _this.removeEventHandler(args.event, args.handler);
        });

        // View
        scope.$on('mapbox-' + id + '::set-view', function (event, args) {
            _this.setView(args);
        });

        scope.$on('mapbox-' + id + '::set-bounds', function (event, args) {
            _this.setBounds(args);
        });

        scope.$on('mapbox-' + id + '::zoom-to', function (event, args) {
            _this.zoomTo(args);
        });

        // Layers
        scope.$on('mapbox-' + id + '::create-layer', function (event, args) {
            if (typeof args.handler === 'function') {
                args.handler(_this.createLayer(args.name, args.type, args.options));
            }
        });

        scope.$on('mapbox-' + id + '::add-layer', function (event, args) {
            _this.addLayer(args);
        });

        scope.$on('mapbox-' + id + '::remove-layer', function (event, args) {
            _this.removeLayer(args);
        });

        scope.$on('mapbox-' + id + '::show-layer', function (event, args) {
            _this.showLayer(args);
        });

        scope.$on('mapbox-' + id + '::hide-layer', function (event, args) {
            _this.hideLayer(args);
        });

        scope.$on('mapbox-' + id + '::fit-layer', function (event, args) {
            _this.fitLayer(args);
        });

        // GeoJSON
        scope.$on('mapbox-' + id + '::add-geojson', function (event, args) {
            _this.addGeoJSONFeature(args);
        });

        // photoMarker
        scope.$on('mapbox-' + id + '::add-photo-marker', function (event, args) {
            _this.addPhotoMarker(args);
        });

        scope.$on('mapbox-' + id + '::remove-geojson-feature', function (event, args) {
            _this.removeGeoJSONFeature(args);
        });

        scope.$on('mapbox-' + id + '::remove-geojson-layer', function (event, args) {
            _this.removeGeoJSONLayer(args);
        });

        // Visibility
        scope.$on('mapbox-' + id + '::hide', function (event, args) {
            scope.hidden = true;
        });

        scope.$on('mapbox-' + id + '::show', function (event, args) {
            scope.hidden = false;
        });

        scope.$on('mapbox-' + id + '::invalidate-size', function (event, args) {
            _this._map.invalidateSize();
        });

        // Editing
        scope.$on('mapbox-' + id + '::edit-on', function(events, args) {
            _this.setOptionSchema(args.styleOptions);
            _this.makeEditable(args.layerName, args.addLayer, true);
            _this.setDrawControls(args.controls, args.controlOptions);
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-update', function(events, args) {
            _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-clear', function(events, args) {
            _this.cleanEditable();
            _this.updateDrawControls();
        });

        scope.$on('mapbox-' + id + '::edit-off', function(events, args) {
            _this.makeEditable(undefined, {}, true);
            _this.updateDrawControls();
        });

        // Picking
        scope.$on('mapbox-' + id + '::pick-portion-on', function(event, args) {
            _this._map.on('click', _this.pickPortion, _this);
        });

        scope.$on('mapbox-' + id + '::pick-district-on', function(event, args) {
            _this._map.on('click', _this.pickDistrict, _this);
        });

        scope.$on('mapbox-' + id + '::pick-field-on', function(event, args) {
            _this._map.on('click', _this.pickField, _this);
        });

        scope.$on('mapbox-' + id + '::define-farm-on', function(event, args) {
            _this._map.on('click', _this.defineNewFarm, _this);
        });

        scope.$on('mapbox-' + id + '::define-service-area-on', function(event, args) {
            _this._map.on('click', _this.defineServiceArea, _this);
        });

        scope.$on('mapbox-' + id + '::define-field-group-on', function(event, args) {
            _this._map.on('click', _this.defineFieldGroup, _this);
        });

        scope.$on('mapbox-' + id + '::feature-click-on', function(event, args) {
            _this._featureClickable = true;
        });

        scope.$on('mapbox-' + id + '::pick-portion-off', function(event, args) {
            _this._map.off('click', _this.pickPortion, _this);
        });

        scope.$on('mapbox-' + id + '::pick-field-off', function(event, args) {
            _this._map.off('click', _this.pickField, _this);
        });

        scope.$on('mapbox-' + id + '::pick-district-off', function(event, args) {
            _this._map.off('click', _this.pickDistrict, _this);
        });

        scope.$on('mapbox-' + id + '::define-farm-off', function(event, args) {
            _this._map.off('click', _this.defineNewFarm, _this);
        });

        scope.$on('mapbox-' + id + '::define-service-area-off', function(event, args) {
            _this._map.off('click', _this.defineServiceArea, _this);
        });

        scope.$on('mapbox-' + id + '::define-field-group-off', function(event, args) {
            _this._map.off('click', _this.defineFieldGroup, _this);
        });

        scope.$on('mapbox-' + id + '::feature-click-off', function(event, args) {
            _this._featureClickable = false;
        });

        scope.$on('mapbox-' + id + '::enable-sidebar', function(event, args) {
            var sidebar = L.control.sidebar('sidebar', {closeButton: true, position: 'right'});
            _this._sidebar = sidebar;
            _this._map.addControl(sidebar);
//            setTimeout(function () {
//                sidebar.show();
//            }, 500);
        });

        // Sidebar
        scope.$on('mapbox-' + id + '::sidebar-show', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.show();
            }
        });

        scope.$on('mapbox-' + id + '::sidebar-hide', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.hide();
            }
        });

        scope.$on('mapbox-' + id + '::sidebar-toggle', function(event, args) {
            if(null != _this._sidebar) {
                _this._sidebar.toggle();
            }
        });
    };

    Mapbox.prototype.mapDestroy = function () {
        if (this._map) {
            for (var layer in this._map._layers) {
                if (this._map._layers.hasOwnProperty(layer)) {
                    this._map.removeLayer(this._map._layers[layer]);
                }
            }

            this._map.remove();
            this._map = null;
        }

        this._optionSchema = {};
        this._editing = false;
        this._editableLayer = null;
        this._editableFeature = null;

        this._geoJSON = {};
        this._layers = {};
        this._layerControls = {
            baseTile: '',
            baseLayers: {},
            overlays: {}
        };
        this._draw = {
            exclude: false,
            addLayer: true,
            options: {},
            controls: {}
        };
    };

    Mapbox.prototype.broadcast = function (event, data) {
        $log.debug(event);
        $rootScope.$broadcast(event, data);
    };

    /*
     * Reset
     */
    Mapbox.prototype.resetLayerControls = function (baseTile, baseLayers, overlays) {
        this._layerControls.baseTile = baseTile;

        try {
            this.map.removeControl(this._layerControls.control);
        } catch(exception) {}

        this.setBaseLayers(baseLayers);
        this.setOverlays(overlays);
    };

    Mapbox.prototype.resetLayers = function (layers) {
        var _this = this;

        angular.forEach(_this._layers, function (layer, name) {
            _this._map.removeLayer(layer);

            delete _this._layers[name];
        });

        angular.forEach(layers, function (layer, name) {
            if (typeof layer.handler === 'function') {
                layer.handler(_this.createLayer(name, layer.type, layer.options));
            }
        });
    };

    Mapbox.prototype.resetGeoJSON = function (geojson) {
        var _this = this;

        angular.forEach(_this._geoJSON, function (layer, name) {
            if (_this._layers[name]) {
                _this._map.removeLayer(_this._layers[name]);

                delete _this._layers[name];
            }
        });

        angular.forEach(geojson, function(layer) {
            _this.addGeoJSONLayer(layer);
        });
    };

    /*
     * Layer Controls
     */
    Mapbox.prototype.setBaseTile = function (baseTile) {
        var _this = this,
            _hasBaseTile = false;

        if (_this._layerControls.baseTile !== baseTile) {
            angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
                if (_this._map.hasLayer(baselayer.layer)) {
                    _this._map.removeLayer(baselayer.layer);
                }
                if (name === baseTile) {
                    _hasBaseTile = true;
                }
            });

            if (_hasBaseTile) {
                _this._layerControls.baseTile = baseTile;
            }

            angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
                if (name === _this._layerControls.baseTile) {
                    _this._map.addLayer(baselayer.layer);
                }
            });
        }
    };

    Mapbox.prototype.setBaseLayers = function (layers) {
        var _this = this;
        var options = _this._mapboxServiceInstance.getOptions();

        if (_this._layerControls.control === undefined) {
            _this._layerControls.control = L.control.layers({}, {});

            if (options.layersControl) {
                _this._map.addControl(_this._layerControls.control);
            }
        }

        angular.forEach(_this._layerControls.baseLayers, function (baselayer, name) {
            if (layers[name] === undefined) {
                _this._layerControls.control.removeLayer(baselayer.layer);
            } else if (baselayer.layer === undefined) {
                _this.addBaseLayer(baselayer, name);
            }
        });

        angular.forEach(layers, function (baselayer, name) {
            if (_this._layerControls.baseLayers[name] === undefined) {
                _this.addBaseLayer(baselayer, name);
            } else {
                baselayer =  _this._layerControls.baseLayers[name];

                if (name === _this._layerControls.baseTile) {
                    baselayer.layer.addTo(_this._map);
                }
            }
        });
    };

    Mapbox.prototype.addBaseLayer = function (baselayer, name, show) {
        if (this._layerControls.baseLayers[name] === undefined) {
            if (baselayer.type == 'tile') {
                baselayer.layer = L.tileLayer(baselayer.tiles);
            } else if (baselayer.type == 'mapbox') {
                baselayer.layer = L.mapbox.tileLayer(baselayer.tiles);
            } else if (baselayer.type == 'google' && typeof L.Google === 'function') {
                baselayer.layer = new L.Google(baselayer.tiles);
            }

            if (name === this._layerControls.baseTile || show) {
                baselayer.layer.addTo(this._map);
            }

            this._layerControls.baseLayers[name] = baselayer;
            this._layerControls.control.addBaseLayer(baselayer.layer, name);
        }
    };

    Mapbox.prototype.setOverlays = function (overlays) {
        var _this = this;

        angular.forEach(_this._layerControls.overlays, function (overlay, name) {
            if (overlays[name] === undefined) {
                _this.removeOverlay(name, overlay);
            }
        });

        angular.forEach(overlays, function (name, layerName) {
            _this.addOverlay(layerName, name);
        });
    };

    Mapbox.prototype.addOverlay = function (layerName, name) {
        var layer = this._layers[layerName];
        name = name || layerName;

        if (this._layerControls.control && layer) {
            if (this._layerControls.overlays[layerName] === undefined) {
                this._layerControls.overlays[layerName] = layer;

                this._layerControls.control.addOverlay(layer, name);
            }
        }
    };

    Mapbox.prototype.removeOverlay = function (name, overlay) {
        var layer = overlay || this._layers[name];

        if (this._layerControls.control && layer) {
            this._layerControls.control.removeLayer(layer);

            delete this._layerControls.overlays[name];
        }
    };

    /*
     * Controls
     */
    Mapbox.prototype.addControls = function (controls) {
        var _this = this;

        angular.forEach(controls, function (control) {
            if (typeof L.control[control.name] == 'function') {
                _this.removeControl(control.name);

                _this._controls[control.name] = L.control[control.name](control.options);
                _this._map.addControl(_this._controls[control.name]);
            }
        });
    };

    Mapbox.prototype.showControls = function () {
        var _this = this;

        if (_this._layerControls.control) {
            _this._map.addControl(_this._layerControls.control);
        }

        angular.forEach(_this._controls, function (control, key) {
            control.addTo(_this._map);
            delete _this._controls[key];
        });
    };

    Mapbox.prototype.hideControls = function () {
        var _this = this;

        if (_this._layerControls.control) {
            _this._layerControls.control.remove();
        }

        angular.forEach(_this._map.options, function (option, key) {
            if (option === true && _this._map[key] && typeof _this._map[key].disable == 'function') {
                _this._controls[key] = _this._map[key];
                _this._map[key].remove();
            }
        });
    };

    Mapbox.prototype.removeControl = function (control) {
        if (this._controls[control]) {
            this._map.removeControl(this._controls[control]);
            delete this._controls[control];
        }
    };

    /*
     * Event Handlers
     */
    Mapbox.prototype.setEventHandlers = function (handlers) {
        var _this = this;

        angular.forEach(handlers, function (handler, event) {
            _this.addEventHandler(event, handler);
        });
    };

    Mapbox.prototype.addEventHandler = function (event, handler) {
        this._map.on(event, handler);
    };

    Mapbox.prototype.removeEventHandler = function (event, handler) {
        this._map.off(event, handler);
    };

    /*
     * View
     */
    Mapbox.prototype.setView = function (view) {
        if (this._map && view !== undefined) {
            this._map.setView(view.coordinates, view.zoom);
        }
    };

    Mapbox.prototype.setBounds = function (bounds) {
        if (this._map && bounds.coordinates) {
            if (bounds.coordinates instanceof Array) {
                if (bounds.coordinates.length > 1) {
                    this._map.fitBounds(bounds.coordinates, bounds.options);
                } else if (bounds.coordinates.length == 1) {
                    this._map.fitBounds(bounds.coordinates.concat(bounds.coordinates), bounds.options);
                }
            } else {
                this._map.fitBounds(bounds.coordinates, bounds.options);
            }
        }
    };

    Mapbox.prototype.zoomTo = function (view) {
        if (this._map && view.coordinates && view.zoom) {
            this._map.setZoomAround(view.coordinates, view.zoom, view.options);
        }
    };

    /*
     * Layers
     */
    Mapbox.prototype.createLayer = function (name, type, options) {
        type = type || 'featureGroup';

        options = underscore.defaults(options || {},  {
            enabled: true
        });

        if (this._layers[name] === undefined) {
            if (type == 'featureGroup' && L.featureGroup) {
                this._layers[name] = L.featureGroup(options);
            } else if (type == 'layerGroup' && L.layerGroup) {
                this._layers[name] = L.layerGroup(options);
            } else if (type == 'markerClusterGroup' && L.markerClusterGroup) {
                this._layers[name] = L.markerClusterGroup(options);
            }

            if (this._layers[name] && options.enabled) {
                this._layers[name].addTo(this._map);
            }
        }

        return this._layers[name];
    };

    Mapbox.prototype.addLayer = function (name) {
        var layer = this._mapboxServiceInstance.getLayer(name),
            added = false;

        if (layer) {
            added = (this._layers[name] == undefined);
            this._layers[name] = layer;
            this._map.addLayer(layer);
        }

        return added;
    };

    Mapbox.prototype.addLayerToLayer = function (name, layer, toLayerName) {
        var toLayer = this._layers[toLayerName];
        
        if (toLayer) {
            if (this._layers[name]) {
                toLayer.removeLayer(layer);
            }

            this._layers[name] = layer;
            toLayer.addLayer(layer);

            return true;
        }

        return false;
    };

    Mapbox.prototype.removeLayer = function (name) {
        var layer = this._layers[name],
            removed = false;

        if (layer) {
            removed = (this._layers[name] != undefined);
            this.removeOverlay(name);
            this._map.removeLayer(layer);

            delete this._layers[name];
        }

        return removed;
    };

    Mapbox.prototype.removeLayerFromLayer = function (name, fromLayerName) {
        var fromLayer = this._layers[fromLayerName],
            layer = this._layers[name],
            removed = false;

        if (fromLayer && layer) {
            removed = (this._layers[name] != undefined);
            fromLayer.removeLayer(layer);

            delete this._layers[name];
        }

        return removed;
    };

    Mapbox.prototype.showLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer) == false) {
            this._map.addLayer(layer);

            if (layer.eachLayer) {
                layer.eachLayer(function (item) {
                    if (item.bindTooltip && item.feature && item.feature.properties && item.feature.properties.label) {
                        item.bindTooltip(item.feature.properties.label.message, item.feature.properties.label.options);
                    }
                });
            }
        }
    };

    Mapbox.prototype.hideLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer)) {
            this._map.removeLayer(layer);
        }
    };

    Mapbox.prototype.fitLayer = function (args) {
        if (args.name) {
            var layer = this._layers[args.name];

            if (layer && this._map.hasLayer(layer)) {
                var bounds = layer.getBounds();

                this._map.fitBounds(bounds, args.options);
            }
        }
    };

    /*
     * GeoJSON
     */
    Mapbox.prototype.addGeoJSONLayer = function (data) {
        var _this = this;

        angular.forEach(data, function(item) {
            _this.addGeoJSONFeature(item);
        });
    };

    Mapbox.prototype.makeIcon = function (data) {
        if (data instanceof L.Class) {
            return data;
        } else {
            if (data.type && L[data.type]) {
                return (L[data.type].icon ? L[data.type].icon(data) : L[data.type](data));
            } else {
                return L.icon(data);
            }
        }
    };

    Mapbox.prototype.addLabel = function (labelData, feature, layer) {
        var _this = this;
        var geojson = geoJSONHelper(feature);

        if (typeof labelData === 'object' && feature.geometry.type !== 'Point') {
            labelData.options = labelData.options || {};

            var label = new L.Tooltip(labelData.options);
            label.setContent(labelData.message);
            label.setLatLng(geojson.getCenter());

            if (labelData.options.permanent == true) {
                label.addTo(_this._map);

                layer.on('add', function () {
                    label.addTo(_this._map);
                });
                layer.on('remove', function () {
                    _this._map.removeLayer(label);
                });
            } else {
                layer.on('mouseover', function () {
                    label.addTo(_this._map);
                });
                layer.on('mouseout', function () {
                    _this._map.removeLayer(label);
                });
            }
        }
    };

    Mapbox.prototype.addPhotoMarker = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName, item.type, item.options);

        _this._geoJSON[item.layerName] = _this._geoJSON[item.layerName] || {};
        _this._geoJSON[item.layerName][item.properties.featureId] = item;

        var image = item;
        var icon = {
            iconSize: [40, 40],
            className: 'leaflet-marker-agrista-photo'
        };
        var fancyboxOptions = {
            helpers: {
                overlay : {
                    css : {
                        'background' : 'rgba(0,0,0,0.7)'
                    }
                }
            },
            aspectRatio: true,
            autoSize: false,
            width: 640,
            height: 640
        };

        L.geoJson(geojson.getJson(), {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, {
                    icon: L.icon(L.extend({
                        iconUrl: image.geojson.properties.data.src
                    }, icon)),
                    title: image.caption || ''
                });
            },
            onEachFeature: function(feature, layer) {
                var added = _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);

                if (added && typeof item.handler === 'function') {
                    item.handler(_this._layers[item.layerName], feature, layer);
                }

                layer.on('click', function(e) {
                    //todo: video
                    //image
                    $.fancybox({
                        href: feature.properties.data.src,
                        title: (feature.properties.data.photoDate || feature.properties.data.uploadDate)
                            + ' @ ' + feature.geometry.coordinates[1].toFixed(4) + (feature.geometry.coordinates[1] > 0 ? ' N' : ' S')
                            + ' ' + feature.geometry.coordinates[0].toFixed(4)+ (feature.geometry.coordinates[0] > 0 ? ' E' : '  W'),
                        type: 'image'
                    }, fancyboxOptions);
                });
            }
        });
    };

    Mapbox.prototype.addGeoJSONFeature = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName, item.type, item.options);

        _this._geoJSON[item.layerName] = _this._geoJSON[item.layerName] || {};
        _this._geoJSON[item.layerName][item.properties.featureId] = item;

        var geojsonOptions = (item.options ? angular.copy(item.options) : {});

        if (geojsonOptions.icon) {
            geojsonOptions.icon = _this.makeIcon(geojsonOptions.icon);
        }

        L.geoJson(geojson.getJson(), {
            style: geojsonOptions.style,
            pointToLayer: function(feature, latlng) {
                var marker;
                // add points as circles
                if(geojsonOptions.radius) {
                    marker = L.circleMarker(latlng, geojsonOptions);
                }
                // add points as markers
                else {
                    marker = L.marker(latlng, geojsonOptions);
                }

                if (geojsonOptions.label) {
                    marker.bindPopup(geojsonOptions.label.message, geojsonOptions.label.options);
                }

                return marker;
            },
            onEachFeature: function(feature, layer) {
                var added = _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);
                _this.addLabel(geojsonOptions.label, feature, layer);

                if (added && typeof item.handler === 'function') {
                    item.handler(_this._layers[item.layerName], feature, layer);
                }

                if (_this._featureClickable && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                    // highlight polygon on click
                    layer.on('click', function(e) {
                        if(feature && feature.properties) {
                            if(feature.properties.highlighted) {
                                feature.properties.highlighted = false;
                                layer.setStyle({color: layer.options.fillColor || 'blue', opacity: layer.options.fillOpacity || 0.4});
                            } else {
                                feature.properties.highlighted = true;
                                layer.setStyle({color: 'white', opacity: 1, fillColor: layer.options.fillColor || 'blue', fillOpacity: layer.options.fillOpacity || 0.4});
                            }
                        }

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::polygon-clicked', {properties: feature.properties, highlighted: feature.properties.highlighted});
                    });
                }
            }
        });
    };

    Mapbox.prototype.removeGeoJSONFeature = function (data) {
        if (this._geoJSON[data.layerName] && this._geoJSON[data.layerName][data.properties.featureId]) {
            this.removeLayerFromLayer(data.properties.featureId, data.layerName);
            
            delete this._geoJSON[data.layerName][data.properties.featureId];
        }
    };

    Mapbox.prototype.removeGeoJSONLayer = function (layerName) {
        if (this._geoJSON[layerName]) {
            this.removeLayer(layerName);

            delete this._geoJSON[layerName];
        }
    };

    /*
     * Edit
     */
    Mapbox.prototype.makeEditable = function (editable, addLayer, clean) {
        var _this = this;

        if (clean == true) {
            _this.cleanEditable();
        }

        if(editable && _this._layers[editable]) {
            _this._layers[editable].eachLayer(function(layer) {
                _this._layers[editable].removeLayer(layer);
                _this._editableFeature.addLayer(layer);
            });
        }
        _this._editableLayer = editable;
        _this._draw.addLayer = (addLayer == undefined ? true : addLayer);
    };

    Mapbox.prototype.cleanEditable = function () {
        var _this = this;

        _this._editableFeature.eachLayer(function(layer) {
            _this._editableFeature.removeLayer(layer);
        });
    };

    Mapbox.prototype.resetEditable = function () {
        var _this = this;

        if (_this._editableFeature) {
            _this._editableFeature.eachLayer(function(layer) {
                _this._editableFeature.removeLayer(layer);

                if (_this._layers[_this._editableLayer]) {
                    _this._layers[_this._editableLayer].addLayer(layer);
                }
            });

            _this._editableFeature = L.featureGroup();
            _this._editableFeature.addTo(_this._map);
        }
    };

    Mapbox.prototype.setDrawControls = function (controls, controlOptions) {
        this._draw.controlOptions = controlOptions || this._draw.controlOptions || {};
        this._draw.controls = {};

        if(controls instanceof Array && typeof L.Control.Draw == 'function') {
            this._draw.controls.polyline = new L.Control.Draw({
                draw: {
                    polyline: (controls.indexOf('polyline') != -1),
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: false
                }
            });

            this._draw.controls.polygon = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: (controls.indexOf('polygon') == -1 ? false : {
                        allowIntersection: false,
                        showArea: true,
                        metric: true
                    }),
                    rectangle: false,
                    circle: false,
                    marker: false
                }
            });

            this._draw.controls.marker = new L.Control.Draw({
                draw: {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: (controls.indexOf('marker') == -1 ? false : {
                        icon: (this._optionSchema.icon ? L.icon(this._optionSchema.icon) : L.Icon.Default())
                    })
                }
            });

            this._draw.controls.editor = new L.Control.Draw({
                draw: false,
                edit: {
                    featureGroup: this._editableFeature,
                    remove: (this._draw.controlOptions.nodelete != true)
                }
            });
        }
    };

    Mapbox.prototype.setOptionSchema = function (options) {
        this._optionSchema = options || {};
    };

    Mapbox.prototype.updateDrawControls = function () {
        try {
            this._map.removeControl(this._draw.controls.polyline);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.polygon);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.marker);
        } catch(exception) {}
        try {
            this._map.removeControl(this._draw.controls.editor);
        } catch(exception) {}

        try {
            this._map.off('draw:created', this.onDrawn, this);
            this._map.off('draw:edited', this.onEdited, this);
            this._map.off('draw:deleted', this.onDeleted, this);
        } catch(exception) {}

        // Draw controls
        if(this._editableFeature.getLayers().length > 0) {
            this._map.on('draw:edited', this.onEdited, this);
            this._map.on('draw:deleted', this.onDeleted, this);

            if(this._draw.controls.editor) {
                this._draw.controls.editor = new L.Control.Draw({
                    draw: false,
                    edit: {
                        featureGroup: this._editableFeature,
                        remove: (this._draw.controlOptions.nodelete != true)
                    }
                });

                this._map.addControl(this._draw.controls.editor);
            }
        }

        if (this._editableLayer && (this._editableFeature.getLayers().length == 0 || this._draw.controlOptions.multidraw)) {
            var controlRequirement = {
                polyline: true,
                polygon: true,
                marker: true
            };

            this._editableFeature.eachLayer(function(layer) {
                if(layer.feature && layer.feature.geometry && layer.feature.geometry.type) {
                    switch(layer.feature.geometry.type) {
                        case 'LineString':
                            controlRequirement.polyline = false;
                            break;
                        case 'Polygon':
                            controlRequirement.polygon = false;
                            break;
                        case 'Point':
                            controlRequirement.marker = false;
                            break;
                    }
                }
            });

            if (this._draw.controlOptions.exclude) {
                if(controlRequirement.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(controlRequirement.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
                }

                if(controlRequirement.marker) {
                    this._map.addControl(this._draw.controls.marker);
                }

                this._map.on('draw:created', this.onDrawn, this);
            } else {
                if(this._draw.controls.polyline) {
                    this._map.addControl(this._draw.controls.polyline);
                }

                if(this._draw.controls.polygon) {
                    this._map.addControl(this._draw.controls.polygon);
                }

                if(this._draw.controls.marker) {
                    this._map.addControl(this._draw.controls.marker);
                }

                this._map.on('draw:created', this.onDrawn, this);
            }
        }
    };

    /*
     * Picking
     */
    Mapbox.prototype.pickPortion = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/portion' + params)
                .success(function (portion) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, portion.sgKey)) {
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey});

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                    }

                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineNewFarm = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/portion' + params)
                .success(function (portion) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, portion.sgKey)) {
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey, portion: portion});

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.pickDistrict = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/district' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        var districtOptions = mapStyleHelper.getStyle('background', 'district');
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, districtOptions, {featureId: district.sgKey});

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineServiceArea = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/district' + params)
                .success(function (district) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, district.sgKey)) {
                        var districtOptions = mapStyleHelper.getStyle('background', 'district');
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, districtOptions, {featureId: district.sgKey, districtName: district.name});

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.pickField = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/field' + params)
                .success(function (field) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, field.sgKey)) {
                        _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, field.position, _this._optionSchema, {});

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.defineFieldGroup = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var host = configuration.getServer();
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get(host + 'api/geo/field' + params)
                .success(function (field) {
                    if(!_this._mapboxServiceInstance.getGeoJSONFeature(_this._editableLayer, field.sgKey)) {
                        _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, field.position, _this._optionSchema, { });

                        _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                        _this.updateDrawControls();

                        _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                    }
                }).error(function(err) {
                    $log.debug(err);
                });
        }
    };

    Mapbox.prototype.onDrawStart = function (e) {
       this._editing = true;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawStop = function (e) {
        this._editing = false;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawn = function (e) {
        var geojson = {
            type: 'Feature',
            geometry: {},
            properties: {
                featureId: objectId().toString()
            }
        };

        var _getCoordinates = function (latlngs, geojson) {
            var polygonCoordinates = [];

            angular.forEach(latlngs, function(latlng) {
                polygonCoordinates.push([latlng.lng, latlng.lat]);
            });

            // Add a closing coordinate if there is not a matching starting one
            if (polygonCoordinates.length > 0 && polygonCoordinates[0] != polygonCoordinates[polygonCoordinates.length - 1]) {
                polygonCoordinates.push(polygonCoordinates[0]);
            }

            // Add area
            if (geojson.properties.area !== undefined) {
                var geodesicArea = L.GeometryUtil.geodesicArea(latlngs);
                var yards = (geodesicArea * 1.19599);

                geojson.properties.area.m_sq += geodesicArea;
                geojson.properties.area.ha += (geodesicArea * 0.0001);
                geojson.properties.area.mi_sq += (yards / 3097600);
                geojson.properties.area.acres += (yards / 4840);
                geojson.properties.area.yd_sq += yards;
            }

            return polygonCoordinates;
        };

        switch (e.layerType) {
            case 'polyline':
                geojson.geometry = {
                    type: 'LineString',
                    coordinates: []
                };

                angular.forEach(e.layer._latlngs, function(latlng) {
                    geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                });

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'polygon':
                geojson.geometry = {
                    type: 'Polygon',
                    coordinates: []
                };

                geojson.properties.area = {
                    m_sq: 0,
                    ha: 0,
                    mi_sq: 0,
                    acres: 0,
                    yd_sq: 0
                };

                angular.forEach(e.layer._latlngs, function (latlngs) {
                    geojson.geometry.coordinates.push(_getCoordinates(latlngs, geojson));
                });

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'marker':
                geojson.geometry = {
                    type: 'Point',
                    coordinates: [e.layer._latlng.lng, e.layer._latlng.lat]
                };

                this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
        }

        this._editing = false;

        if (this._draw.addLayer) {
            this._mapboxServiceInstance.addGeoJSON(this._editableLayer, geojson, this._optionSchema, geojson.properties);
            this.makeEditable(this._editableLayer);
            this.updateDrawControls();
        }
    };

    Mapbox.prototype.onEditStart = function (e) {
        this._editing = true;

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onEditStop = function (e) {
        this._editing = false;
        this.resetEditable();
        this.makeEditable(this._editableLayer);
        this.updateDrawControls();

        this.broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onEdited = function (e) {
        var _this = this;

        e.layers.eachLayer(function(layer) {
            var geojson = {
                type: 'Feature',
                geometry: {
                    type: layer.feature.geometry.type
                },
                properties: {
                    featureId: layer.feature.properties.featureId
                }
            };

            if (_this._draw.controls.polygon.options.draw.polygon.showArea) {
                geojson.properties.area = {
                    m_sq: 0,
                    ha: 0,
                    mi_sq: 0,
                    acres: 0,
                    yd_sq: 0
                };
            }

            var _getCoordinates = function (latlngs, geojson) {
                var polygonCoordinates = [];

                angular.forEach(latlngs, function(latlng) {
                    polygonCoordinates.push([latlng.lng, latlng.lat]);
                });

                // Add a closing coordinate if there is not a matching starting one
                if (polygonCoordinates.length > 0 && polygonCoordinates[0] != polygonCoordinates[polygonCoordinates.length - 1]) {
                    polygonCoordinates.push(polygonCoordinates[0]);
                }

                // Add area
                if (geojson.properties.area !== undefined) {
                    var geodesicArea = L.GeometryUtil.geodesicArea(latlngs);
                    var yards = (geodesicArea * 1.19599);

                    geojson.properties.area.m_sq += geodesicArea;
                    geojson.properties.area.ha += (geodesicArea * 0.0001);
                    geojson.properties.area.mi_sq += (yards / 3097600);
                    geojson.properties.area.acres += (yards / 4840);
                    geojson.properties.area.yd_sq += yards;
                }

                return polygonCoordinates;
            };

            switch(layer.feature.geometry.type) {
                case 'Point':
                    geojson.geometry.coordinates = [layer._latlng.lng, layer._latlng.lat];

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'Polygon':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function (latlngs) {
                        geojson.geometry.coordinates.push(_getCoordinates(latlngs, geojson));
                    });

                    if (geojson.geometry.coordinates.length > 1) {
                        geojson.geometry.type = 'MultiPolygon';
                        geojson.geometry.coordinates = [geojson.geometry.coordinates];
                    }

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'MultiPolygon':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function (latlngs, index) {
                        geojson.geometry.coordinates.push([]);
                        angular.forEach(latlngs, function (latlngs) {
                            geojson.geometry.coordinates[index].push(_getCoordinates(latlngs, geojson));
                        });
                    });

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'LineString':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function(latlng) {
                        geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                    });

                    _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
            }
        });
    };

    // may delete one or two geometry at most (field label & field shape)
    Mapbox.prototype.onDeleted = function (e) {
        var _this = this;

        var _removeLayer = function (layer) {
            _this._editableFeature.removeLayer(layer);

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted', layer.feature.properties.featureId);
        };

        if(e.layers.getLayers().length > 0) {
            // Layer is within the editableFeature
            e.layers.eachLayer(function(deletedLayer) {
                if (deletedLayer.feature !== undefined) {
                    _removeLayer(deletedLayer);
                } else {
                    _this._editableFeature.eachLayer(function (editableLayer) {
                        if (editableLayer.hasLayer(deletedLayer)) {
                            _removeLayer(editableLayer);
                        }
                    });
                }
            });
        } else {
            // Layer is the editableFeature
            _this._editableFeature.clearLayers();

            _this.broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted');
        }

        _this.updateDrawControls();
    };
    
    return {
        restrict: 'E',
        template: '<div class="map" ng-hide="hidden" ng-transclude></div>',
        replace: true,
        transclude: true,
        link: function (scope, element, attrs) {
            if (_instances[attrs.id] === undefined) {
                _instances[attrs.id] = new Mapbox(attrs, scope);
            }
        },
        controller: function ($scope, $attrs) {
            this.getMap = function () {
                return _instances[$attrs.id]._map;
            };
        }
    }
}]);

sdkInterfaceMapApp.directive('mapboxControl', ['$rootScope', function ($rootScope) {
    var _positions = {
        topleft: '.leaflet-top.leaflet-left',
        topright: '.leaflet-top.leaflet-right',
        bottomleft: '.leaflet-bottom.leaflet-left',
        bottomright: '.leaflet-bottom.leaflet-right'
    };

    function addListeners(scope, element) {
        var parent = element.parent();

        $rootScope.$on('mapbox-' + parent.attr('id') + '::init', function (event, map) {
            element.on('click', function (e) {
                if (e.originalEvent) {
                    e.originalEvent._stopped = true;
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                }
            });

            element.on('mouseover', function () {
                map.dragging.disable();
            });

            element.on('mouseout', function () {
                map.dragging.enable();
            });

            parent.find('.leaflet-control-container ' + _positions[scope.position]).prepend(element);

            scope.hidden = false;
        });
    }

    return {
        restrict: 'E',
        require: '^mapbox',
        replace: true,
        transclude: true,
        scope: {
            position: '@'
        },
        template: '<div class="leaflet-control"><div class="leaflet-bar" ng-hide="hidden" ng-transclude></div></div>',
        link: function (scope, element, attrs) {
            scope.hidden = true;
        },
        controller: function($scope, $element) {
            addListeners($scope, $element);
        }
    }
}]);

