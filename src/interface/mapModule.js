var sdkInterfaceMapApp = angular.module('ag.sdk.interface.map', ['ag.sdk.utilities', 'ag.sdk.id']);

/*
 * GeoJson
 */
sdkInterfaceMapApp.factory('geoJSONHelper', function () {
    function GeojsonHelper(json, properties) {
        if (!(this instanceof GeojsonHelper)) {
            return new GeojsonHelper(json, properties);
        }

        this.addGeometry(json, properties);
    }

    function _recursiveCoordinateFinder (bounds, coordinates) {
        if (coordinates) {
            if (angular.isArray(coordinates[0])) {
                angular.forEach(coordinates, function(coordinate) {
                    _recursiveCoordinateFinder(bounds, coordinate);
                });
            } else if (angular.isArray(coordinates)) {
                bounds.push([coordinates[1], coordinates[0]]);
            }
        }
    }

    GeojsonHelper.prototype = {
        getJson: function () {
            return this._json;
        },
        getType: function () {
            return this._json.type;
        },
        getCenter: function (bounds) {
            var bounds = bounds || this.getBounds();
            var center = [0, 0];

            angular.forEach(bounds, function(coordinate) {
                center[0] += coordinate[0];
                center[1] += coordinate[1];
            });

            return [(center[0] / bounds.length), (center[1] / bounds.length)];
        },
        getBounds: function () {
            var features = this._json.features || [this._json];
            var bounds = [];

            angular.forEach(features, function(feature) {
                var geometry = feature.geometry || feature;

                _recursiveCoordinateFinder(bounds, geometry.coordinates);
            });

            return bounds;
        },
        addProperties: function (properties) {
            var _this = this;

            if (this._json && properties) {
                if (_this._json.type != 'FeatureCollection' && _this._json.type != 'Feature') {
                    _this._json = {
                        type: 'Feature',
                        geometry: _this._json,
                        properties: properties
                    };
                } else {
                    _this._json.properties = _this._json.properties || {};

                    angular.forEach(properties, function(property, key) {
                        _this._json.properties[key] = property;
                    });
                }
            }

            return _this;
        },
        addGeometry: function (geometry, properties) {
            if (this._json === undefined) {
                this._json = geometry;

                this.addProperties(properties);
            } else {
                if (this._json.type != 'FeatureCollection' && this._json.type != 'Feature') {
                    this._json = {
                        type: 'Feature',
                        geometry: this._json
                    };
                }

                if (this._json.type == 'Feature') {
                    this._json = {
                        type: 'FeatureCollection',
                        features: [this._json]
                    };
                }

                if (this._json.type == 'FeatureCollection') {
                    this._json.features.push({
                        type: 'Feature',
                        geometry: geometry,
                        properties: properties
                    });
                }
            }

            return this;
        }
    };

    return function (json, properties) {
        return new GeojsonHelper(json, properties);
    }
});

sdkInterfaceMapApp.factory('mapMarkerHelper', function () {
    var _getMarker = function (name, state, options) {
        return _.defaults(options || {}, {
            iconUrl: 'img/icons/' + name + '.' + state + '.png',
            shadowUrl: 'img/icons/' + name + '.shadow.png',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            shadowSize: [73, 48],
            shadowAnchor: [24, 48],
            labelAnchor: [12, -24]
        });
    };

    return {
        getMarker: function (name, options) {
            var marker = {};

            if (typeof name === 'string') {
                marker = _getMarker(name, 'default', options)
            }

            return marker;
        },
        getMarkerStates: function (name, states, options) {
            var markers = {};

            if (typeof name === 'string') {
                angular.forEach(states, function(state) {
                    markers[state] = _getMarker(name, state, options);
                });
            }

            return markers;
        }
    }
});

sdkInterfaceMapApp.factory('mapStyleHelper', ['mapMarkerHelper', function (mapMarkerHelper) {
    var _markerIcons = {
        improvement: mapMarkerHelper.getMarkerStates('improvement', ['default', 'success']),
        homestead: mapMarkerHelper.getMarkerStates('homestead', ['default', 'success'])
    };

    var _mapStyles = {
        foreground: {
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
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.8
                }
            },
            crop: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.8
                }
            },
            improvement: {
                icon: _markerIcons.improvement.success,
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.8
                }
            },
            'irrigated cropland': {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.8
                }
            },
            pasture: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.8
                }
            },
            'permanent crop': {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.8
                }
            },
            plantation: {
                style: {
                    weight: 2,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.8
                }
            },
            homestead: {
                icon: _markerIcons.homestead.success
            }
        },
        background: {
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
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#5b4723",
                    fillOpacity: 0.4
                }
            },
            crop: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#aa64b0",
                    fillOpacity: 0.4
                }
            },
            improvement: {
                icon: _markerIcons.improvement.default,
                style: {
                    weight: 4,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ff6666",
                    fillOpacity: 0.5
                }
            },
            'irrigated cropland': {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#4573d5",
                    fillOpacity: 0.4
                }
            },
            pasture: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#ffde40",
                    fillOpacity: 0.4
                }
            },
            'permanent crop': {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#487811",
                    fillOpacity: 0.4
                }
            },
            plantation: {
                style: {
                    weight: 1,
                    color: 'white',
                    opacity: 0.8,
                    fillColor: "#00e64a",
                    fillOpacity: 0.4
                }
            },
            homestead: {
                icon: _markerIcons.homestead.default,
                label: {
                    message: 'Homestead'
                }
            }
        }

    };

    return {
        getStyle: function(composition, layerName) {
            return (_mapStyles[composition] ? (_mapStyles[composition][layerName] || {}) : {});
        },
        setStyle: function(composition, layerName, style) {
            _mapStyles[composition] = _mapStyles[composition] || {};
            _mapStyles[composition][layerName] = style;
        }
    }
}]);

/**
 * Maps
 */
sdkInterfaceMapApp.provider('mapboxService', function () {
    var _defaultConfig = {
        layerControl: {
            baseTile: 'agrista.map-65ftbmpi',
            baseLayers: {
                'Agrista': {
                    base: true,
                    type: 'mapbox'
                },
                'Google': {
                    type: 'google',
                    tiles: 'SATELLITE'
                }
            },
            overlays: {}
        },
        handlers: {
            zoom: {
                scrollWheelZoom: false,
                dragging: true,
                touchZoom: true,
                doubleClickZoom: true,
                tap: true
            }
        },
        events: {},
        view: {
            coordinates: [-28.691, 24.714],
            zoom: 6
        },
        bounds: {},
        layers: {},
        geojson: {}
    };

    var _instances = {};
    
    this.config = function (options) {
        _defaultConfig = _.defaults(options || {}, _defaultConfig);
    };

    this.$get = ['$rootScope', 'objectId', function ($rootScope, objectId) {
        /**
        * @name MapboxServiceInstance
        * @param id
        * @constructor
        */
        function MapboxServiceInstance(id) {
            var _this = this;

            _this._id = id;
            _this._show = false;
            _this._ready = false;

            _this._config = angular.copy(_defaultConfig);
            _this._requestQueue = [];

            $rootScope.$on('mapbox-' + _this._id + '::init', function () {
                _this.dequeueRequests();
                _this._ready = true;
            });

            $rootScope.$on('mapbox-' + _this._id + '::destroy', function () {
                _this._ready = false;
                _this._config = angular.copy(_defaultConfig);
            });
        }

        MapboxServiceInstance.prototype = {
            getId: function () {
                return this._id;
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
                this.removeLayers();
                this.removeGeoJSON();
            },

            /*
             * Queuing requests
             */
            enqueueRequest: function (event, args) {
                if (this._ready) {
                    $rootScope.$broadcast(event, args);
                } else {
                    this._requestQueue.push({
                        event: event,
                        args: args
                    });
                }
            },
            dequeueRequests: function () {
                if (this._requestQueue.length) {
                    do {
                        var request = this._requestQueue.shift();

                        $rootScope.$broadcast(request.event, request.args);
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
                this._show = false;
                this.enqueueRequest('mapbox-' + this._id + '::hide', {});
            },
            show: function() {
                this._show = true;
                this.enqueueRequest('mapbox-' + this._id + '::show', {});
            },
            invalidateSize: function() {
                this.enqueueRequest('mapbox-' + this._id + '::invalidate-size', {});
            },

            /*
             * Map
             */
            getMapBounds: function(handler) {
                this.enqueueRequest('mapbox-' + this._id + '::get-bounds', handler);
            },

            /*
             * Layer Control
             */
            getBaseTile: function () {
                return this._config.layerControl.baseTile;
            },
            setBaseTile: function (tile) {
                this._config.layerControl.baseTile = tile;

                $rootScope.$broadcast('mapbox-' + this._id + '::set-basetile', tile);
            },

            getBaseLayers: function () {
                return this._config.layerControl.baseLayers;
            },
            setBaseLayers: function (layers) {
                this._config.layerControl.baseLayers = layers;

                $rootScope.$broadcast('mapbox-' + this._id + '::set-baselayers', layers);
            },

            getOverlays: function () {
                return this._config.layerControl.overlays;
            },
            addOverlay: function (layerName, name) {
                if (layerName && this._config.layerControl.overlays[layerName] == undefined) {
                    this._config.layerControl.overlays[layerName] = name;

                    $rootScope.$broadcast('mapbox-' + this._id + '::add-overlay', {
                        layerName: layerName,
                        name: name || layerName
                    });
                }
            },
            removeOverlay: function (layerName) {
                if (layerName && this._config.layerControl.overlays[layerName]) {
                    $rootScope.$broadcast('mapbox-' + this._id + '::remove-overlay', layerName);

                    delete this._config.layerControl.overlays[layerName];
                }
            },
            removeOverlays: function () {
                var _this = this;
                
                angular.forEach(this._config.layerControl.overlays, function(overlay, name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-overlay', name);

                    delete _this._config.layerControl.overlays[name];
                });
            },

            /*
             * Map handlers
             */
            getHandlers: function (type) {
                return this._config.handlers[type];
            },
            setHandlers: function (type, data) {
                var handler = this._config.handlers[type];

                angular.forEach(data, function(value, key) {
                    handler[key] = value;
                });

                $rootScope.$broadcast('mapbox-' + this._id + '::set-' + type + '-handlers', handler);
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

                angular.forEach(events, function(event) {
                    _this.removeEventHandler(event);
                    _this._config.events[event] = handler;

                    $rootScope.$broadcast('mapbox-' + _this._id + '::add-event-handler', {
                        event: event,
                        handler: handler
                    });
                });
            },
            removeEventHandler: function (events) {
                events = (events instanceof Array ? events : [events]);

                var _this = this;

                angular.forEach(events, function(event) {
                    if (_this._config.events[event] !== undefined) {
                        $rootScope.$broadcast('mapbox-' + _this._id + '::remove-event-handler', {
                            event: event,
                            handler: _this._config.events[handler]
                        });

                        delete _this._config.events[event];
                    }
                });
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
                    this._config.view.coordinates = coordinates;
                    this._config.view.zoom = zoom || this._config.view.zoom;

                    $rootScope.$broadcast('mapbox-' + this._id + '::set-view', this._config.view);
                }
            },
            getBounds: function () {
                return this._config.bounds;
            },
            setBounds: function (coordinates, options) {
                if (coordinates instanceof Array) {
                    this._config.bounds = {
                        coordinates: coordinates,
                        options: options || {
                            reset: false
                        }
                    }
                }

                $rootScope.$broadcast('mapbox-' + this._id + '::set-bounds', this._config.bounds);
            },
            zoomTo: function (coordinates, zoom, options) {
                $rootScope.$broadcast('mapbox-' + this._id + '::zoom-to', {
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

                this.enqueueRequest('mapbox-' + this._id + '::create-layer', {
                    name: name,
                    type: type,
                    options: options,
                    handler: function (layer) {
                        _this._config.layers[name] = layer;

                        handler(layer);
                    }
                });
            },
            getLayer: function (name) {
                return this._config.layers[name];
            },
            getLayers: function () {
                return this._config.layers;
            },
            addLayer: function (name, layer) {
                this._config.layers[name] = layer;

                $rootScope.$broadcast('mapbox-' + this._id + '::add-layer', name);
            },
            removeLayer: function (names) {
                if ((names instanceof Array) === false) names = [names];

                var _this = this;

                angular.forEach(names, function(name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-layer', name);

                    delete _this._config.layers[name];
                });
            },
            removeLayers: function () {
                var _this = this;
                
                angular.forEach(this._config.layers, function(layer, name) {
                    $rootScope.$broadcast('mapbox-' + -this._id + '::remove-layer', name);

                    delete _this._config.layers[name];
                });
            },
            showLayer: function (name) {
                $rootScope.$broadcast('mapbox-' + this._id + '::show-layer', name);
            },
            hideLayer: function (name) {
                $rootScope.$broadcast('mapbox-' + this._id + '::hide-layer', name);
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
                properties = _.defaults(properties || {},  {
                    featureId: objectId().toString()
                });

                var data = {
                    layerName: layerName,
                    geojson: geojson,
                    options: options,
                    properties: properties,
                    onAddCallback: onAddCallback
                };

                this._config.geojson[layerName] = this._config.geojson[layerName] || {};
                this._config.geojson[layerName][properties.featureId] = data;

                $rootScope.$broadcast('mapbox-' + this._id + '::add-geojson', data);

                return properties.featureId;
            },
            removeGeoJSONFeature: function(layerName, featureId) {
                if (this._config.geojson[layerName] && this._config.geojson[layerName][featureId]) {
                    $rootScope.$broadcast('mapbox-' + this._id + '::remove-geojson-feature', this._config.geojson[layerName][featureId]);

                    delete this._config.geojson[layerName][featureId];
                }
            },
            removeGeoJSONLayer: function(layerNames) {
                if ((layerNames instanceof Array) === false) layerNames = [layerNames];

                var _this = this;

                angular.forEach(layerNames, function(layerName) {
                    if (_this._config.geojson[layerName]) {
                        $rootScope.$broadcast('mapbox-' + _this._id + '::remove-geojson-layer', layerName);

                        delete _this._config.geojson[layerName];
                    }
                });
            },
            removeGeoJSON: function() {
                var _this = this;
                
                angular.forEach(_this._config.geojson, function(layer, name) {
                    $rootScope.$broadcast('mapbox-' + _this._id + '::remove-geojson-layer', name);

                    delete _this._config.geojson[name];
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
                this.enqueueRequest('mapbox-' + this._id + '::define-farm-off');
            },
            defineFieldGroupOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::define-field-group-off');
            },
            featureClickOff: function() {
                this.enqueueRequest('mapbox-' + this._id + '::feature-click-off');
            },
            printMap: function() {
                this.enqueueRequest('mapbox-' + this._id + '::print-map');
            }
        };



        /*
         * Get or create a MapboxServiceInstance
         */
        return function (id) {
            if (_instances[id] === undefined) {
                _instances[id] = new MapboxServiceInstance(id);
            }

            return _instances[id];
        };
    }];
});

/**
 * mapbox
 */
sdkInterfaceMapApp.directive('mapbox', ['$rootScope', '$http', 'mapboxService', 'geoJSONHelper', 'objectId', function ($rootScope, $http, mapboxService, geoJSONHelper, objectId) {
    var _instances = {};
    
    function Mapbox(id, scope) {
        this._id = id;

        this._optionSchema = {};
        this._editing = false;
        this._editableLayer;
        this._editableFeature = L.featureGroup();
        this._featureClickable;

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

        this.mapInit();
        this.addListeners(scope);

        $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::init', this._map);
    }

    /*
     * Config
     */
    Mapbox.prototype.mapInit = function() {
        // Setup mapboxServiceInstance
        this._mapboxServiceInstance = mapboxService(this._id);

        // Setup map
        var view = this._mapboxServiceInstance.getView();

        this._map = L.map(this._id).setView(view.coordinates, view.zoom);

        this._editableFeature = L.featureGroup();
        this._editableFeature.addTo(this._map);

        this.setZoomHandlers(this._mapboxServiceInstance.getHandlers('zoom'));
        this.setEventHandlers(this._mapboxServiceInstance.getEventHandlers());
        this.resetLayers(this._mapboxServiceInstance.getLayers());
        this.resetGeoJSON(this._mapboxServiceInstance.getGeoJSON());
        this.resetLayerControls(this._mapboxServiceInstance.getBaseTile(), this._mapboxServiceInstance.getBaseLayers(), this._mapboxServiceInstance.getOverlays());
        this.setBounds(this._mapboxServiceInstance.getBounds());

        this._map.on('draw:drawstart', this.onDrawStart, this);
        this._map.on('draw:editstart', this.onDrawStart, this);
        this._map.on('draw:deletestart', this.onDrawStart, this);
        this._map.on('draw:drawstop', this.onDrawStop, this);
        this._map.on('draw:editstop', this.onDrawStop, this);
        this._map.on('draw:deletestop', this.onDrawStop, this);
    };

    Mapbox.prototype.addListeners = function (scope) {
        scope.hidden = !this._mapboxServiceInstance.shouldShow();
        
        var _this = this;
        var id = this._mapboxServiceInstance.getId();

        scope.$on('mapbox-' + id + '::get-bounds', function (event, handler) {
            if (typeof handler === 'function') {
                handler(_this._map.getBounds());
            }
        });

        // Destroy mapbox directive
        scope.$on('$destroy', function () {
            delete _instances[id];

            _this.mapDestroy();

            $rootScope.$broadcast('mapbox-' + id + '::destroy');
        });

        // Layer Controls
        scope.$on('mapbox-' + id + '::set-basetile', function (event, args) {
            _this.setBaseTile(args);
        });

        scope.$on('mapbox-' + id + '::set-baselayers', function (event, args) {
            _this.setBaseLayers(args);
        });

        scope.$on('mapbox-' + id + '::add-overlay', function (event, args) {
            _this.addOverlay(args.layerName, args.name);
        });

        scope.$on('mapbox-' + id + '::remove-overlay', function (event, args) {
            _this.removeOverlay(args);
        });

        // Map Handlers
        scope.$on('mapbox-' + id + '::set-zoom-handlers', function (event, args) {
            _this.setZoomHandlers(args);
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

        // GeoJSON
        scope.$on('mapbox-' + id + '::add-geojson', function (event, args) {
            _this.addGeoJSONFeature(args);
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

        scope.$on('mapbox-' + id + '::print-map', function(event, args) {
            leafletImage(_this._map, function(err, canvas) {
                var img = document.createElement('img');
                var dimensions = _this._map.getSize();
                img.width = dimensions.x;
                img.height = dimensions.y;
                img.src = canvas.toDataURL();
                $rootScope.$broadcast('mapbox-' + id + '::print-map-done', img);
            });
        });
    };

    Mapbox.prototype.mapDestroy = function () {
        for (var layer in this._map._layers) {
            if (this._map._layers.hasOwnProperty(layer)) {
                this._map.removeLayer(this._map._layers[layer]);
            }
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

        this._map.remove();
        this._map = null;
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
            _this._layers[name] = layer;

            _this._map.addLayer(layer);
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
    Mapbox.prototype.setBaseTile = function (tile) {
        var _this = this;

        _this._layerControls.baseTile = tile;

        angular.forEach(_this._layerControls.baseLayers, function (baselayer) {
            if (baselayer.base && baselayer.layer) {
                baselayer.layer.setUrl(tile);
            }
        });
    };

    Mapbox.prototype.setBaseLayers = function (layers) {
        var _this = this;

        if (_this._layerControls.control === undefined) {
            _this._layerControls.control = L.control.layers({}, {});
            _this._map.addControl(_this._layerControls.control);
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

                if (baselayer.base) {
                    baselayer.layer.addTo(this._map);
                }
            }
        });
    };

    Mapbox.prototype.addBaseLayer = function (baselayer, name) {
        if (baselayer.base) {
            baselayer.tiles = this._layerControls.baseTile;
        }

        if (baselayer.type == 'tile') {
            baselayer.layer = L.tileLayer(baselayer.tiles);
        } else if (baselayer.type == 'mapbox') {
            baselayer.layer = L.mapbox.tileLayer(baselayer.tiles);
        } else if (baselayer.type == 'google' && typeof L.Google === 'function') {
            baselayer.layer = new L.Google(baselayer.tiles);
        }

        if (baselayer.base) {
            baselayer.layer.addTo(this._map);
        }

        this._layerControls.baseLayers[name] = baselayer;
        this._layerControls.control.addBaseLayer(baselayer.layer, name);
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
     * Map Handlers
     */
    Mapbox.prototype.setZoomHandlers = function (handlers) {
        var _this = this;

        angular.forEach(handlers, function(enabled, handler) {
            if (_this._map[handler]) {
                if (enabled) {
                    _this._map[handler].enable();
                } else {
                    _this._map[handler].disable();
                }
            }
        });
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
        if (this._map && bounds.coordinates && bounds.coordinates.length > 0) {
            this._map.setView(bounds.coordinates[0], 6);

            if (bounds.coordinates.length > 1) {
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
        options = options || {};

        if (this._layers[name] === undefined) {
            if (type == 'featureGroup' && L.featureGroup) {
                this._layers[name] = L.featureGroup(options);
            } else if (type == 'markerClusterGroup' && L.markerClusterGroup) {
                this._layers[name] = L.markerClusterGroup(options);
            }

            if (this._layers[name]) {
                this._layers[name].addTo(this._map);
            }
        }

        return this._layers[name];
    };

    Mapbox.prototype.addLayer = function (name) {
        var layer = this._mapboxServiceInstance.getLayer(name);

        if (layer) {
            this._layers[name] = layer;

            this._map.addLayer(layer);
        }
    };

    Mapbox.prototype.addLayerToLayer = function (name, layer, toLayerName) {
        var toLayer = this._layers[toLayerName];
        
        if (toLayer) {
            this._layers[name] = layer;

            toLayer.addLayer(layer);
        }
    };

    Mapbox.prototype.removeLayer = function (name) {
        var layer = this._layers[name];

        if (layer) {
            this.removeOverlay(name);
            this._map.removeLayer(layer);

            delete this._layers[name];
        }
    };

    Mapbox.prototype.removeLayerFromLayer = function (name, fromLayerName) {
        var fromLayer = this._layers[fromLayerName];
        var layer = this._layers[name];

        if (fromLayer) {
            fromLayer.removeLayer(layer);
            
            delete this._layers[name];
        }
    };

    Mapbox.prototype.showLayer = function (name) {
        var layer = this._layers[name];

        if (layer && this._map.hasLayer(layer) == false) {
            this._map.addLayer(layer);

            layer.eachLayer(function (item) {
                if (item.bindLabel && item.feature.properties.label) {
                    item.bindLabel(item.feature.properties.label.message, item.feature.properties.label.options);
                }
            });
        }
    };

    Mapbox.prototype.hideLayer = function (name) {
        var layer =  this._layers[name];

        if (layer &&  this._map.hasLayer(layer)) {
            this._map.removeLayer(layer);
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
        if (data) {
            if (data.type && L[data.type] && L[data.type].icon) {
                return L[data.type].icon(data);
            } else {
                return L.icon(data);
            }
        } else {
            return L.Icon.Default();
        }
    };

    Mapbox.prototype.addLabel = function (labelData, feature, layer) {
        var _this = this;
        var geojson = geoJSONHelper(feature);

        if (typeof labelData === 'object') {
            labelData.options = labelData.options || {};

            if ((labelData.options.centered || labelData.options.noHide) && feature.geometry.type !== 'Point' && typeof _this._map.showLabel === 'function') {
                var label = new L.Label(_.extend(labelData.options), {
                    offset: [6, -15]
                });

                label.setContent(labelData.message);
                label.setLatLng(geojson.getCenter());

                if (labelData.options.noHide == true) {
                    _this._map.showLabel(label);
                } else {
                    layer.on('mouseover', function () {
                        _this._map.showLabel(label);
                    });
                    layer.on('mouseout', function () {
                        _this._map.removeLayer(label);
                    });
                }

                layer.on('remove', function () {
                    _this._map.removeLayer(label);
                })
            } else if (typeof layer.bindLabel === 'function') {
                layer.bindLabel(labelData.message, labelData.options);
            }
        }
    };

    Mapbox.prototype.addGeoJSONFeature = function (item) {
        var _this = this;
        var geojson = geoJSONHelper(item.geojson, item.properties);

        _this.createLayer(item.layerName);

        _this._geoJSON[item.layerName] = _this._geoJSON[item.layerName] || {};
        _this._geoJSON[item.layerName][item.properties.featureId] = item;

        var geojsonOptions = (item.options ? angular.copy(item.options) : {});

        if (geojsonOptions.icon) {
            geojsonOptions.icon = _this.makeIcon(geojsonOptions.icon);
        }

        L.geoJson(geojson.getJson(), {
            style: geojsonOptions.style,
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, geojsonOptions);
            },
            onEachFeature: function(feature, layer) {
                _this.addLayerToLayer(feature.properties.featureId, layer, item.layerName);
                _this.addLabel(geojsonOptions.label, feature, layer);

                if (typeof item.onAddCallback === 'function') {
                    item.onAddCallback(feature, layer);
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

                        $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::polygon-clicked', {properties: feature.properties, highlighted: feature.properties.highlighted});
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

    Mapbox.prototype.setDrawControls = function (controls, controlOptions) {
        this._draw.controlOptions = controlOptions || {};
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

            this._draw.controls.edit = new L.Control.Draw({
                draw: false,
                edit: {
                    featureGroup: this._editableFeature,
                    remove: (this._draw.controlOptions.nodelete != true)
                }
            });
        }
    };

    Mapbox.prototype.setOptionSchema = function (options) {
        this._optionSchema = options;
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
            this._map.removeControl(this._draw.controls.edit);
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

            if(this._draw.controls.edit) {
                this._map.addControl(this._draw.controls.edit);
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
            $http.get('/api/portion-polygon/' + e.latlng.lat + '/' + e.latlng.lng)
                .success(function (portion) {
                    _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                    _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey});

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                }).error(function(err) {
                    console.log(err);
                });
        }
    };

    Mapbox.prototype.defineNewFarm = function (e) {
        var _this = this;

        if (_this._editing == false) {
            $http.get('/api/portion-polygon/' + e.latlng.lat + '/' + e.latlng.lng)
                .success(function (portion) {
                    _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, portion.position, _this._optionSchema, {featureId: portion.sgKey, portion: portion});

                    _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                    _this.updateDrawControls();

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::portion-added', portion);
                }).error(function(err) {
                    console.log(err);
                });
        }
    };

    Mapbox.prototype.pickDistrict = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get('/api/geo/district-polygon' + params)
                .success(function (district) {
                    _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                    _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, _this._optionSchema, {featureId: district.sgKey});

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                }).error(function(err) {
                    console.log(err);
                });
        }
    };

    Mapbox.prototype.defineServiceArea = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get('/api/geo/district-polygon' + params)
                .success(function (district) {
                    _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, _this._optionSchema, {featureId: district.sgKey, districtName: mdName});

                    _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                    _this.updateDrawControls();

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::district-added', district);
                }).error(function(err) {
                    console.log(err);
                });
        }
    };

    Mapbox.prototype.pickField = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get('/api/geo/field-polygon' + params)
                .success(function (district) {
                    _this._mapboxServiceInstance.removeGeoJSONLayer(_this._editableLayer);
                    _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, district.position, _this._optionSchema, {});

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', district);
                }).error(function(err) {
                    console.log(err);
                });
        }
    };

    Mapbox.prototype.defineFieldGroup = function (e) {
        var _this = this;

        if (_this._editing == false) {
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get('/api/geo/field-polygon' + params)
                .success(function (field) {
                    _this._mapboxServiceInstance.addGeoJSON(_this._editableLayer, field.position, _this._optionSchema, { });

                    _this.makeEditable(_this._editableLayer, _this._draw.addLayer, false);
                    _this.updateDrawControls();

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::field-added', field);
                }).error(function(err) {
                    console.log(err);
                });
        }
    };

    Mapbox.prototype.onDrawStart = function (e) {
       this._editing = true;

        $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawStop = function (e) {
        this._editing = false;

        $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-editing', this._editing);
    };

    Mapbox.prototype.onDrawn = function (e) {
        var geojson = {
            type: 'Feature',
            geometry: {},
            properties: {
                featureId: objectId().toString()
            }
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

                $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'polygon':
                geojson.geometry = {
                    type: 'Polygon',
                    coordinates: [[]]
                };

                angular.forEach(e.layer._latlngs, function(latlng) {
                    geojson.geometry.coordinates[0].push([latlng.lng, latlng.lat]);
                });

                // Add a closing coordinate if there is not a matching starting one
                if (geojson.geometry.coordinates[0].length > 0 && geojson.geometry.coordinates[0][0] != geojson.geometry.coordinates[0][geojson.geometry.coordinates[0].length - 1]) {
                    geojson.geometry.coordinates[0].push(geojson.geometry.coordinates[0][0]);
                }

                if (this._draw.controls.polygon.options.draw.polygon.showArea) {
                    var geodesicArea = L.GeometryUtil.geodesicArea(e.layer._latlngs);
                    var yards = (geodesicArea * 1.19599);

                    geojson.properties.area = {
                        m_sq: geodesicArea,
                        ha: (geodesicArea * 0.0001),
                        mi_sq: (yards / 3097600),
                        acres: (yards / 4840),
                        yd_sq: yards
                    };
                }

                $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
            case 'marker':
                geojson.geometry = {
                    type: 'Point',
                    coordinates: [e.layer._latlng.lng, e.layer._latlng.lat]
                };

                $rootScope.$broadcast('mapbox-' + this._mapboxServiceInstance.getId() + '::geometry-created', geojson);
                break;
        }

        if (this._draw.addLayer) {
            this._mapboxServiceInstance.addGeoJSON(this._editableLayer, geojson, this._optionSchema, geojson.properties);
            this.makeEditable(this._editableLayer);
            this.updateDrawControls();
        }
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

            switch(layer.feature.geometry.type) {
                case 'Point':
                    geojson.geometry.coordinates = [layer._latlng.lng, layer._latlng.lat];

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'Polygon':
                    geojson.geometry.coordinates = [[]];

                    angular.forEach(layer._latlngs, function(latlng) {
                        geojson.geometry.coordinates[0].push([latlng.lng, latlng.lat]);
                    });

                    // Add a closing coordinate if there is not a matching starting one
                    if (geojson.geometry.coordinates[0].length > 0 && geojson.geometry.coordinates[0][0] != geojson.geometry.coordinates[0][geojson.geometry.coordinates[0].length - 1]) {
                        geojson.geometry.coordinates[0].push(geojson.geometry.coordinates[0][0]);
                    }

                    if (_this._draw.controls.polygon.options.draw.polygon.showArea) {
                        var geodesicArea = L.GeometryUtil.geodesicArea(layer._latlngs);
                        var yards = (geodesicArea * 1.19599);

                        geojson.properties.area = {
                            m_sq: geodesicArea,
                            ha: (geodesicArea * 0.0001),
                            mi_sq: (yards / 3097600),
                            acres: (yards / 4840),
                            yd_sq: yards
                        };
                    }

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
                case 'LineString':
                    geojson.geometry.coordinates = [];

                    angular.forEach(layer._latlngs, function(latlng) {
                        geojson.geometry.coordinates.push([latlng.lng, latlng.lat]);
                    });

                    $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-edited', geojson);
                    break;
            }
        });
    };

    // may delete one or two geometry at most (field label & field shape)
    Mapbox.prototype.onDeleted = function (e) {
        var _this = this;

        if(e.layers.getLayers().length > 0) {
            // Layer is within the editableFeature
            e.layers.eachLayer(function(layer) {
                _this._editableFeature.removeLayer(layer);

                $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted', layer.feature.properties.featureId);
            });
        } else {
            // Layer is the editableFeature
            _this._editableFeature.clearLayers();

            $rootScope.$broadcast('mapbox-' + _this._mapboxServiceInstance.getId() + '::geometry-deleted');
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
                _instances[attrs.id] = new Mapbox(attrs.id, scope);
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
    var _position;

    var _positions = {
        topleft: '.leaflet-top.leaflet-left',
        topright: '.leaflet-top.leaflet-right',
        bottomleft: '.leaflet-bottom.leaflet-left',
        bottomright: '.leaflet-bottom.leaflet-right'
    };

    function addListeners(element) {
        var parent = element.parent();

        $rootScope.$on('mapbox-' + parent.attr('id') + '::init', function (event, map) {
            parent.find('.leaflet-control-container ' + _positions[_position]).prepend(element);
        });
    }

    return {
        restrict: 'E',
        require: '^mapbox',
        replace: true,
        transclude: true,
        template: '<div class="leaflet-control"><div class="leaflet-bar" ng-transclude></div></div>',
        link: function (scope, element, attrs) {
            _position = (attrs.position == undefined ? 'bottomright' : attrs.position);
        },
        controller: function($element) {
            addListeners($element);
        }
    }
}]);

