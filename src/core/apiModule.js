var sdkApiApp = angular.module('ag.sdk.api', ['ag.sdk.config', 'ag.sdk.utilities']);

/**
 * User API
 */
sdkApiApp.factory('userApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getUsers: function (page) {
            return pagingService.page(_host + 'api/users', page);
        },
        getUsersByRole: function (id, role) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/users/farmer/' + id + '?rolename=' + role, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createUser: function (userData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user', userData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function (id, username) {
            if (username) {
                var param = '?username=' + username;
            }
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/user/' + id + (param ? param : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (userData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + userData.id, userData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/user/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Role API
 */
sdkApiApp.factory('roleApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        //todo: handle different report types
        getRoles: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/roles', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateRoleApps: function (roleList) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/role-apps', roleList, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Team API
 */
sdkApiApp.factory('teamApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTeams: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/teams', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createTeam: function (teamData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team', teamData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeam: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/team/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeamUsers: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/team/' + id + '/users', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTeam: function (teamData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team/' + teamData.id, teamData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTeam: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/team/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Organizational Unit API
 */
sdkApiApp.factory('organizationalUnitApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getOrganizationalUnits: function() {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/organizational-units', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getOrganizationalUnit: function(id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/organizational-unit/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateOrganizationalUnit: function(unitData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/organizational-unit/' + unitData.id, unitData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Notification API
 */
sdkApiApp.factory('notificationApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getNotifications: function (page) {
            return pagingService.page(_host + 'api/notifications', page);
        },
        createNotification: function (notificationData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification', notificationData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/notification/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        rejectNotification: function (id, rejectData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification/' + id + '/reject', rejectData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        acceptNotification: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/notification/' + id + '/accept', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Task API
 */
sdkApiApp.factory('taskApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTasks: function (page) {
            return pagingService.page(_host + 'api/tasks', page);
        },
        createTask: function (taskData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task', taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTask: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/task/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendTask: function (id, requestData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + id + '/send', requestData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTask: function (taskData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + taskData.id, taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTaskStatus: function (taskData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + taskData.id + '/status', taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTaskAssignment: function (taskData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + taskData.id, taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTask: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/task/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Merchant API
 */
sdkApiApp.factory('merchantApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getMerchants: function (page) {
            return pagingService.page(_host + 'api/merchants', page);
        },
        searchMerchants: function (query) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchants?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchByService: function (query, point) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchants/services?search=' + query + (point ? '&x=' + point[0] + '&y=' + point[1] : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createMerchant: function (merchantData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant', merchantData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteMerchant: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteMerchantUser: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/invite-user', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchant: function (id, isUuid) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchant/' + id + (isUuid ? '?uuid=true' : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchantActivities: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/merchant/' + id + '/activities', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateMerchant: function (merchantData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + merchantData.id, merchantData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteMerchant: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/merchant/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Service API
 */
sdkApiApp.factory('serviceApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getServices: function (page) {
            return pagingService.page(_host + 'api/services', page);
        },
        getServiceTypes: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/service/types', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getService: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/service/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farmer API
 */
sdkApiApp.factory('farmerApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFarmers: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/farmers' + (id ? '/' + id : ''), page);
        },
        searchFarmers: function (query) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/farmers?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createFarmer: function (farmData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer', farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteFarmer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {

                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/farmer/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarmer: function (farmData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer/' + farmData.id, farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarmer: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farmer/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Legal Entity API
 */
sdkApiApp.factory('legalEntityApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getEntities: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/legalentities' + (id ? '/' + id : ''), page);
        },
        updateEntity: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadEntityAttachments: function (id, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getEntity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/legalentity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createEntity: function (data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteEntity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/legalentity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farm API
 */
sdkApiApp.factory('farmApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFarms: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/farms' + (id ? '/' + id : ''), page);
        },
        createFarm: function (farmData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm', farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/farm/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarm: function (farmData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm/' + farmData.id, farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarm: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/farm/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Asset API
 */
sdkApiApp.factory('assetApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getAssets: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/assets' + (id ? '/' + id : ''), page);
        },
        createAsset: function (assetData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset', assetData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAsset: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/asset/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateAsset: function (assetData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + assetData.id, assetData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteAsset: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAssetAttachments: function (id, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/asset/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getAssetGuideline: function (id, date) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/asset/' + id + '/guideline' + (date ? '?date=' + date : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Document API
 */
sdkApiApp.factory('documentApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getDocuments: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/documents' + (id ? '/' + id : ''), page);
        },
        createDocument: function (documentData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document', documentData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDocument: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/document/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendDocument: function (id, requestData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/send', requestData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateDocument: function (documentData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + documentData.id, documentData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteDocument: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadDocumentAttachments: function (id, data) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/document/' + id + '/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getDocumentPdf: function (data) {
            return promiseService.wrap(function (promise) {
                var m = encodeURIComponent(data).match(/%[89ABab]/g);
                var options = {responseType: "blob",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': data.length + (m ? m.length : 0),
                        Connection: 'keep-alive',
                        'Transfer-Encoding': 'chunked',
                        'Accept': 'application/pdf'
                    }
                };
                $http.post(_host + 'api/document/pdf/get', data, options)
                    .success(function (res, status) {
                        var blob = new Blob([res], {type: "application/pdf"});
                        var objectUrl = URL.createObjectURL(blob);
                        promise.resolve({status: status, url: objectUrl});
                    })
                    .error(function (res, status) {
                        promise.reject({status: status});
                    });
            });
        },
        saveDocumentPdf: function (data) {
            return promiseService.wrap(function (promise) {
                var m = encodeURIComponent(data).match(/%[89ABab]/g);
                var options = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': data.length + (m ? m.length : 0),
                        Connection: 'keep-alive',
                        'Transfer-Encoding': 'chunked'
                    }
                };
                $http.post(_host + 'api/document/pdf/save', data, options)
                    .success(function (res, status) {
                        promise.resolve(res);
                    })
                    .error(function (res, status) {
                        promise.reject({status: status});
                    });
            });
        }
    };
}]);

/**
 * Activity API
 */
sdkApiApp.factory('activityApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getActivities: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/activities' + (id ? '/' + id : ''), page);
        },
        createActivity: function (activityData) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/activity', activityData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getActivity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/activity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteActivity: function (id) {
            return promiseService.wrap(function (promise) {
                $http.post(_host + 'api/activity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Agrista API
 */
sdkApiApp.factory('agristaApi', ['$http', 'pagingService', 'promiseService', 'configuration', function ($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getMerchants: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/agrista/merchants', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchMerchants: function (query) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/agrista/merchants?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Attachment API
 */
sdkApiApp.factory('attachmentApi', ['$http', 'promiseService', 'configuration', function ($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getAttachmentUri: function (key) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/file-attachment/' + key + '/url', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getPDFPreviewImage: function(key) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/attachment/pdf/preview-image/' + encodeURIComponent(key), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Aggregation API
 */
sdkApiApp.factory('aggregationApi', ['$http', 'configuration', 'promiseService', 'pagingService', function ($http, configuration, promiseService, pagingService) {
    // TODO: Refactor so that the aggregationApi can be extended for downstream platforms
    var _host = configuration.getServer();

    return {
        getCustomerLocations: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-locations', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-geodata?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getSubRegionBoundaries: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/guideline-subregions?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getGroupCustomerLocations: function () {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-locations-group', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getGroupCustomerFarmlands: function (northEastLat, northEastLng, southWestLat, southWestLng) {
            return promiseService.wrap(function (promise) {
                $http.get(_host + 'api/aggregation/customer-geodata-group?x1=' + southWestLng + '&y1=' + northEastLat + '&x2=' + northEastLng + '&y2=' + southWestLat, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmlandOverlaps: function (page) {
            return pagingService.page(_host + 'api/aggregation/farmland-overlap', page);
        },
        getGuidelineExceptions: function (page) {
            return pagingService.page(_host + 'api/aggregation/guideline-exceptions', page);
        }
    };
}]);

/**
 * Guideline API
 */
apiApp.factory('guidelineApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getSubRegion: function(subregionId, versionId) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/guidelines/' + subregionId + (versionId ? '?versionId=' + versionId : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },

        getGuidelinesByGeo: function(x, y) {
            //TODO: pass a point to api and get the subregion & guidelines
//            return promiseService.wrap(function(promise) {
//                promise.resolve([]);
//            });
            return promiseService.wrap(function(promise) {
                var param = '';
                if(x && y) {
                    param = '?x=' + x + '&y=' + y;
                } else {
                    x = 26.064,
                        y = -27.776
                }
                $http.get('api/aggregation/subregion' + param, {withCredentials: true}).then(function (res) {
                    console.log(res.data);
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);
