var sdkLibraryApp = angular.module('ag.sdk.library', []);

/**
 * This module includes other required third party libraries
 */
sdkLibraryApp.constant('bigNumber', window.BigNumber);

sdkLibraryApp.constant('underscore', window._);

sdkLibraryApp.constant('moment', window.moment);

sdkLibraryApp.constant('topologySuite', window.jsts);

sdkLibraryApp.constant('naturalSort', window.naturalSort);
