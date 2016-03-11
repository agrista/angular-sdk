var sdkLibraryApp = angular.module('ag.sdk.library', []);

/**
 * This module includes other required third party libraries
 */
sdkLibraryApp.constant('underscore', window._);

sdkLibraryApp.constant('moment', window.moment);

sdkLibraryApp.constant('geojsonUtils', window.gju);

sdkLibraryApp.constant('naturalSort', window.naturalSort);
