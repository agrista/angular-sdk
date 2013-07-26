'use strict';

define(['cordova', 'angular'], function () {
    var module = angular.module('storageModule', []);

    /**
     * @name storageModule.fileStorageService
     * @description File Storage Service
     * @return {object} Angular Service
     **/
    module.factory('fileStorageService', ['$q', function ($q) {
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
            var defer = $q.defer();

            // Initialize the file system
            _initFileSystem(function () {
                // Request the file entry
                _fileSystem.root.getFile(fileURI, options, function (fileEntry) {
                    defer.resolve(fileEntry);
                }, function () {
                    defer.reject(_errors.fileNotFound);
                });
            }, function () {
                defer.reject(_errors.noFileSystem);
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
                var defer = $q.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                    defer.resolve({
                        exists: true,
                        file: fileEntry.name
                    });
                }, function (res) {
                    defer.reject(res);
                });

                return defer.promise;
            },
            /**
             * Read a file
             * @param {string} fileURI The file to read
             * @return {object} Promise for deferred result
             **/
            read: function (fileURI) {
                var defer = $q.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                    // Request the file
                    fileEntry.file(function (file) {
                        // Read the file
                        var _fileReader = new FileReader();
                        _fileReader.onloadend = function () {
                            defer.resolve({
                                read: true,
                                file: fileEntry.name,
                                content: _fileReader.result
                            });
                        };
                        _fileReader.onerror = function () {
                            defer.reject(_errors.fileNotReadable);
                        };

                        _fileReader.readAsText(file);
                    }, function () {
                        defer.reject(_errors.fileNotFound);
                    });
                }, function (res) {
                    defer.reject(res);
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
                var defer = $q.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: true}).then(function (fileEntry) {
                    // Request the file
                    fileEntry.createWriter(function (fileWriter) {
                        // Write the file
                        fileWriter.onwriteend = function () {
                            defer.resolve({
                                write: true,
                                file: fileEntry.name
                            });
                        };
                        fileWriter.onerror = function () {
                            defer.reject(_errors.fileNotWritable);
                        };

                        fileWriter.write(content);
                    }, function () {
                        defer.reject(_errors.fileNotFound);
                    });
                }, function (res) {
                    defer.reject(res);
                });

                return defer.promise;
            },
            /**
             * Remove a file
             * @param {string} fileURI The file to remove
             * @return {object} Promise for deferred result
             **/
            remove: function (fileURI) {
                var defer = $q.defer();

                // Initialize & request the file entry
                _getFileEntry(fileURI, {create: false}).then(function (fileEntry) {
                    fileEntry.remove(function () {
                        defer.resolve({
                            remove: true,
                            file: fileEntry.name
                        });
                    }, function () {
                        defer.reject(_errors.fileNotFound);
                    });
                }, function (res) {
                    defer.reject(res);
                });

                return defer.promise;
            }
        };
    }]);
});
