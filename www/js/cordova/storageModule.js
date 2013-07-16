'use strict';

define(['cordova', 'angular', 'common/utilityModule'], function () {
    var module = angular.module('storageModule', ['utilityModule']);

    /**
     * File Storage Service
     * @return {object} Angular Service
     **/
    module.factory('storageService', ['promiseService', function (promiseService) {
        var _fileSystem = undefined;
        var _errors = {
            noFileSystem: {err: 'NoFileSystem', msg: 'Could not initialize file system'},
            fileNotFound: {err: 'FileNotFound', msg: 'Could not find requested file'},
            fileNotReadable: {err: 'FileNotReadable', msg: 'Could not read from file'},
            fileNotWritable: {err: 'FileNotWritable', msg: 'Could not write to file'}
        };

        /**
         * Initializes the local File System
         * @param {function} onSuccessCb Successful operation callback
         * @param {function} onErrorCb Error in operation callback
         **/
        var _initFileSystem = function (onSuccessCb, onErrorCb) {
            if (_fileSystem === undefined) {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                    _fileSystem = fs;
                    onSuccessCb();
                }, onErrorCb);
            } else {
                onSuccessCb();
            }
            ;
        };

        /**
         * Initialize File System and get a file
         * @param {string} fileURI The file to request
         * @param {object} options file options: {create: boolean, exclusive: boolean}
         * @return {object} Promise for deferred result
         **/
        var _getFileEntry = function (fileURI, options) {
            var defer = promiseService.defer();

            // Initialize the file system
            _initFileSystem(function () {
                // Request the file entry
                _fileSystem.root.getFile(fileURI, options, function (fileEntry) {
                    promiseService.resolve(defer, fileEntry);
                }, function () {
                    promiseService.reject(defer, _errors.fileNotFound);
                });
            }, function () {
                promiseService.reject(defer, _errors.noFileSystem);
            });

            return defer.promise;
        };

        console.log('Initialized storageService');

        return {
            /**
             * Check if a file exists
             * @param {string} fileURI The file to check
             * @return {object} Promise for deferred result
             **/
            exists: function (fileURI) {
                var defer = promiseService.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                    promiseService.resolve(defer, {
                        exists: true,
                        file: fileEntry.name
                    });
                }, function (res) {
                    promiseService.reject(defer, res);
                });

                return defer.promise;
            },
            /**
             * Read a file
             * @param {string} fileURI The file to read
             * @return {object} Promise for deferred result
             **/
            read: function (fileURI) {
                var defer = promiseService.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                    // Request the file
                    fileEntry.file(function (file) {
                        // Read the file
                        var _fileReader = new FileReader();
                        _fileReader.onloadend = function () {
                            promiseService.resolve(defer, {
                                read: true,
                                file: fileEntry.name,
                                content: _fileReader.result
                            });
                        };
                        _fileReader.onerror = function () {
                            promiseService.reject(defer, _errors.fileNotReadable);
                        };

                        _fileReader.readAsText(file);
                    }, function () {
                        promiseService.reject(defer, _errors.fileNotFound);
                    });
                }, function (res) {
                    promiseService.reject(defer, res);
                });

                return defer.promise;
            },
            /**
             * Write a file
             * @param {string} fileURI The file to write
             * @param {string} content The content to write to file
             * @return {object} Promise for deferred result
             **/
            write: function (fileURI, content) {
                var defer = promiseService.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: true}).then(function (fileEntry) {
                    // Request the file
                    fileEntry.createWriter(function (fileWriter) {
                        // Write the file
                        fileWriter.onwriteend = function () {
                            promiseService.resolve(defer, {
                                write: true,
                                file: fileEntry.name
                            });
                        };
                        fileWriter.onerror = function () {
                            promiseService.reject(defer, _errors.fileNotWritable);
                        };

                        fileWriter.write(content);
                    }, function () {
                        promiseService.reject(defer, _errors.fileNotFound);
                    });
                }, function (res) {
                    promiseService.reject(defer, res);
                });

                return defer.promise;
            },
            /**
             * Remove a file
             * @param {string} fileURI The file to remove
             * @return {object} Promise for deferred result
             **/
            remove: function (fileURI) {
                var defer = promiseService.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                    fileEntry.remove(function () {
                        promiseService.resolve(defer, {
                            remove: true,
                            file: fileEntry.name
                        });
                    }, function () {
                        promiseService.reject(defer, _errors.fileNotFound);
                    });
                }, function (res) {
                    promiseService.reject(defer, res);
                });

                return defer.promise;
            }
        };
    }]);
});
