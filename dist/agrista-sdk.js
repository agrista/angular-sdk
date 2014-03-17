var sdkApiApp = angular.module('ag.sdk.api', ['ag.sdk.config', 'ag.sdk.utilities']);

/**
 * User API
 */
sdkApiApp.factory('userApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getUsers: function (page) {
            return pagingService.page(_host + 'api/users', page);
        },
        getUsersByRole: function (id, role) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/users/farmer/' + id + '?rolename=' + role, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createUser: function (userData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/user', userData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function (id, username) {
            if(username) {
                var param = '?username=' + username;
            }
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/user/' + id + (param? param : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (userData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/user/' + userData.id, userData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteUser: function (id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('roleApi', ['$http', 'promiseService', 'configuration', function($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        //todo: handle different report types
        getRoles: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/roles', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateRoleApps: function (roleList) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('teamApi', ['$http', 'promiseService', 'configuration', function($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTeams: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/teams', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createTeam: function(teamData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/team', teamData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeam: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/team/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeamUsers: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/team/' + id + '/users', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTeam: function (teamData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/team/' + teamData.id, teamData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTeam: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/team/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Notification API
 */
sdkApiApp.factory('notificationApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getNotifications: function (page) {
            return pagingService.page(_host + 'api/notifications', page);
        },
        getNotification: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/notification/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        rejectNotification: function (id, rejectData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/notification/' + id + '/reject', rejectData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteNotification: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/notification/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Task API
 */
sdkApiApp.factory('taskApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getTasks: function (page) {
            return pagingService.page(_host + 'api/tasks', page);
        },
        createTask: function(taskData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/task', taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTask: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/task/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendTask: function (id, requestData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/task/' + id + '/send', requestData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTask: function (taskData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/task/' + taskData.id, taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTaskStatus: function (taskData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/task/' + taskData.id + '/status', taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTaskAssignment: function (taskData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/task/' + taskData.id, taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTask: function (id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('merchantApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getMerchants: function(page) {
            return pagingService.page(_host + 'api/merchants', page);
        },
        searchMerchants: function(query) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/merchants?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchByService: function(query, point) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/merchants/services?search=' + query + (point ? '&x=' + point[0] + '&y=' + point[1] : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createMerchant: function(merchantData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/merchant', merchantData, {withCredentials: true}).then(function(res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteMerchant: function(id) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/merchant/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteMerchantUser: function(id) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/merchant/' + id + '/invite-user', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchant: function(id, isUuid) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/merchant/' + id + (isUuid ? '?uuid=true' : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchantActivities: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/merchant/' + id + '/activities', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateMerchant: function(merchantData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/merchant/' + merchantData.id, merchantData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteMerchant: function (id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('serviceApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getServices: function(page) {
            return pagingService.page(_host + 'api/services', page);
        },
        getServiceTypes: function() {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/service/types', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getService: function(id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('farmerApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFarmers: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/farmers' + (id ? '/' + id : ''),  page);
        },
        searchFarmers: function(query) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farmers?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createFarmer: function(farmData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/farmer', farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteFarmer: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/farmer/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {

                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmer: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farmer/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarmer: function (farmData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/farmer/' + farmData.id, farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarmer: function (id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('legalEntityApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getEntities: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/legalentities' + (id ? '/' + id : ''),  page);
        },
        updateEntity: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/legalentity/' + data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadEntityAttachments: function(id, data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/legalentity/' + id +'/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getEntity: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/legalentity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createEntity: function(data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/legalentity', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteEntity: function (id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('farmApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getFarms: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/farms' + (id ? '/' + id : ''),  page);
        },
        createFarm: function(farmData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/farm', farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/farm/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarm: function (farmData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/farm/' + farmData.id, farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarm: function (id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('assetApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getAssets: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/assets' + (id ? '/' + id : ''),  page);
        },
        createAsset: function(assetData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/asset', assetData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAsset: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/asset/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateAsset: function (assetData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/asset/' + assetData.id, assetData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteAsset: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/asset/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAssetAttachments: function(id, data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/asset/' + id +'/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        }
    };
}]);

/**
 * Document API
 */
sdkApiApp.factory('documentApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getDocuments: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/documents' + (id ? '/' + id : ''),  page);
        },
        createDocument: function(documentData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/document', documentData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDocument: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/document/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendDocument: function (id, requestData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/document/' + id + '/send', requestData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateDocument: function (documentData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/document/' + documentData.id, documentData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteDocument: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/document/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadDocumentAttachments: function(id, data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/document/' + id +'/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        },
        getDocumentPdf: function (data) {
            return promiseService.wrap(function(promise) {
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
                $http.post(_host + 'api/document/pdf', data, options)
                    .success(function(res, status) {
                        var blob = new Blob([res], {type: "application/pdf"});
                        var objectUrl = URL.createObjectURL(blob);
                        promise.resolve({status: status, url: objectUrl});
                    })
                    .error(function(res, status) {
                        promise.reject({status: status});
                    });
            });
        }
    };
}]);

/**
 * Activity API
 */
sdkApiApp.factory('activityApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getActivities: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page(_host + 'api/activities' + (id ? '/' + id : ''),  page);
        },
        createActivity: function(activityData) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/activity', activityData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getActivity: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/activity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteActivity: function (id) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('agristaApi', ['$http', 'pagingService', 'promiseService', 'configuration', function($http, pagingService, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getMerchants: function() {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/agrista/merchants', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchMerchants : function(query) {
            return promiseService.wrap(function(promise) {
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
sdkApiApp.factory('attachmentApi', ['$http', 'promiseService', 'configuration', function($http, promiseService, configuration) {
    var _host = configuration.getServer();

    return {
        getAttachmentUri: function(key) {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'api/attachment/' + key, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);


var sdkAuthorizationApp = angular.module('ag.sdk.authorization', ['ag.sdk.config', 'ag.sdk.utilities', 'ngCookies']);

sdkAuthorizationApp.factory('authorizationApi', ['$http', 'promiseService', 'configuration', function($http, promiseService, configuration) {
    var _host = configuration.getServer();
    
    return {
        login: function (email, password) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'login', {email: email, password: password}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        resetPassword: function (hash, password) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/password-reset', {hash: hash, password: password}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        requestResetPasswordEmail: function(email) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/password-reset-email', {email: email}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        changePassword: function (id, oldPassword, newPassword) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/user/password', {password: oldPassword, newPassword: newPassword}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function () {
            return promiseService.wrap(function(promise) {
                $http.get(_host + 'current-user', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        registerUser: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post(_host + 'api/register', data).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        logout: function() {
            return $http.post(_host + 'logout');
        }
    };
}]);

sdkAuthorizationApp.provider('authorization', ['$httpProvider', function ($httpProvider) {
    // TODO: make read-only
    var _userRoles = {
        open: 1,
        user: 2,
        admin: 4
    };
    var _accessLevels = {
        open: (_userRoles.open | _userRoles.user | _userRoles.admin),
        user: (_userRoles.user | _userRoles.admin),
        admin: (_userRoles.admin)
    };

    var _defaultUser = {
        email: '',
        role: _userRoles.open
    };

    var _lastError = undefined;

    // Intercept any HTTP responses that are not authorized
    $httpProvider.interceptors.push(['$q', '$injector', '$rootScope', function ($q, $injector, $rootScope) {
        return {
            responseError: function (err) {
                if (err.status === 401) {
                    console.warn('Not authorized');

                    $rootScope.$broadcast('authorization::unauthorized');
                }

                return $q.reject(err);
            }
        }
    }]);

    return {
        userRole: _userRoles,
        accessLevel: _accessLevels,

        $get: ['$rootScope', '$cookieStore', 'authorizationApi', 'promiseService', function ($rootScope, $cookieStore, authorizationApi, promiseService) {
            var _user = _getUser();

            authorizationApi.getUser().then(function (res) {
                if (res.user !== null) {
                    _user = _setUser(res.user);

                    $rootScope.$broadcast('authorization::login', _user);
                }
            });

            function _getUser() {
                return $cookieStore.get('user') || _defaultUser;
            }

            function _setUser(user) {
                user = user || _defaultUser;

                if (user.role === undefined) {
                    user.role = (user.accessLevel == 'admin' ? _userRoles.admin : _userRoles.user);
                }

                $cookieStore.put('user', user);

                return user;
            }

            return {
                userRole: _userRoles,
                accessLevel: _accessLevels,
                lastError: function () {
                    return _lastError;
                },
                currentUser: function () {
                    return _user;
                },

                isAllowed: function (level) {
                    console.log('authorization.allowed: ' + level + ' ' + _user.role + ' = ' + (level & _user.role));

                    return (level & _user.role) != 0;
                },
                isLoggedIn: function () {
                    console.log('authorization.loggedIn: ' + _accessLevels.user + ' ' + _user.role + ' = ' + (_accessLevels.user & _user.role));

                    return (_accessLevels.user & _user.role) != 0;
                },
                login: function (email, password) {
                    return promiseService.wrap(function(promise) {
                        authorizationApi.login(email, password).then(function (res) {
                            if (res.user !== null) {
                                _lastError = undefined;
                                _user = _setUser(res.user);
                                promise.resolve(_user);

                                $rootScope.$broadcast('authorization::login', _user);
                            } else {
                                _lastError = {
                                    type: 'error',
                                    message: 'The entered e-mail and/or password is incorrect. Please try again.'
                                };

                                _user = _setUser(_defaultUser);
                                promise.reject();
                            }

                        }, function (err) {
                            _user = _setUser(_defaultUser);
                            promise.reject(err);
                        });
                    });
                },
                requestResetPasswordEmail: authorizationApi.requestResetPasswordEmail,
                resetPassword: authorizationApi.resetPassword,
                changePassword: function (oldPassword, newPassword) {
                    return authorizationApi.changePassword(_user.id, oldPassword, newPassword);
                },
                changeUserDetails: function (userDetails) {
                    return authorizationApi.updateUser(_user.id, userDetails).then(function (res) {
                        _user = _setUser(userDetails);
                    });
                },
                register: function(data) {
                    return promiseService.wrap(function(promise) {
                        authorizationApi.registerUser(data).then(function (res) {
                            if (res !== null) {
                                _lastError = undefined;
                                _user = _setUser(res);
                                promise.resolve(_user);

                                $rootScope.$broadcast('authorization::login', _user);
                            } else {
                                _user = _setUser(_defaultUser);
                                promise.reject();
                            }
                        }, function (err) {
                            _lastError = {
                                type: 'error',
                                message: 'There is already an Agrista account associated with this email address. Please login.'
                            };

                            _user = _setUser(_defaultUser);
                            promise.reject(err);
                        });
                    });
                },
                logout: function () {
                    return authorizationApi.logout().then(function () {
                        _user = _setUser(_defaultUser);
                        $rootScope.$broadcast('authorization::logout', _user);
                    });
                }
            }
        }]
    }
}]);

var sdkConfigApp = angular.module('ag.sdk.config', []);

/**
 * @name configurationProvider / configuration
 * @description Provider to define the configuration of servers
 */
sdkConfigApp.provider('configuration', ['$httpProvider', function($httpProvider) {
    var _version = '';
    var _host = 'local';

    var _servers = {
        local: '/',
        alpha: 'http://staging.farmer.agrista.net/',
        beta: 'http://farmer.agrista.net/'
    };

    return {
        setServers: function(servers) {
            angular.forEach(servers, function (host, name) {
                if (host.lastIndexOf('/') !== host.length - 1) {
                    host += '/';
                }

                _servers[name] = host;
            });

            this.useHost(_host, _version);
        },
        useHost: function(host, version, cCallback) {
            if (typeof version === 'function') {
                cCallback = version;
                version = '';
            }

            _version = version || '';

            if (_servers[host] !== undefined) {
                _host = host;

                // Enable cross domain
                $httpProvider.defaults.useXDomain = true;
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
            }

            if (typeof cCallback === 'function') {
                cCallback(_servers[_host]);
            }
        },
        $get: function() {
            return {
                getVersion: function() {
                    return _version;
                },
                getHost: function() {
                    return _host;
                },
                getServer: function() {
                    return _servers[_host];
                }
            }
        }
    }
}]);
var sdkIdApp = angular.module('ag.sdk.id', ['ngCookies']);

sdkIdApp.factory('objectId', ['$cookieStore', function($cookieStore) {
    /*
     *
     * Copyright (c) 2011 Justin Dearing (zippy1981@gmail.com)
     * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
     * and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
     * This software is not distributed under version 3 or later of the GPL.
     *
     * Version 1.0.1-dev
     *
     */

    /**
     * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
     * and converts between that format and the standard 24 character representation.
     */
    var ObjectId = (function () {
        var increment = 0;
        var pid = Math.floor(Math.random() * (32767));
        var machine = Math.floor(Math.random() * (16777216));

        // Get local stored machine id
        var mongoMachineId = parseInt($cookieStore.get('mongoMachineId'));

        if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
            machine = Math.floor($cookieStore.get('mongoMachineId'));
        }

        // Just always stick the value in.
        $cookieStore.get('mongoMachineId', machine);

        function ObjId() {
            if (!(this instanceof ObjectId)) {
                return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
            }

            if (typeof (arguments[0]) == 'object') {
                this.timestamp = arguments[0].timestamp;
                this.machine = arguments[0].machine;
                this.pid = arguments[0].pid;
                this.increment = arguments[0].increment;
            }
            else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
                this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
                    this.machine = Number('0x' + arguments[0].substr(8, 6)),
                    this.pid = Number('0x' + arguments[0].substr(14, 4)),
                    this.increment = Number('0x' + arguments[0].substr(18, 6))
            }
            else if (arguments.length == 4 && arguments[0] != null) {
                this.timestamp = arguments[0];
                this.machine = arguments[1];
                this.pid = arguments[2];
                this.increment = arguments[3];
            }
            else {
                this.timestamp = Math.floor(new Date().valueOf() / 1000);
                this.machine = machine;
                this.pid = pid;
                this.increment = increment++;
                if (increment > 0xffffff) {
                    increment = 0;
                }
            }
        };
        return ObjId;
    })();

    ObjectId.prototype.getDate = function () {
        return new Date(this.timestamp * 1000);
    };

    ObjectId.prototype.toArray = function () {
        var strOid = this.toString();
        var array = [];
        var i;
        for(i = 0; i < 12; i++) {
            array[i] = parseInt(strOid.slice(i*2, i*2+2), 16);
        }
        return array;
    };

    /**
     * Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
     */
    ObjectId.prototype.toString = function () {
        var timestamp = this.timestamp.toString(16);
        var machine = this.machine.toString(16);
        var pid = this.pid.toString(16);
        var increment = this.increment.toString(16);
        return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
            '000000'.substr(0, 6 - machine.length) + machine +
            '0000'.substr(0, 4 - pid.length) + pid +
            '000000'.substr(0, 6 - increment.length) + increment;
    };

    ObjectId.prototype.toBase64String = function() {
        return window.btoa(this.toString());
    };

    return function() {
        return new ObjectId();
    };
}]);

sdkIdApp.factory('generateUUID', function () {
    function GenerateUUID () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    };

    return function() {
        return new GenerateUUID();
    };
});

var sdkMonitorApp = angular.module('ag.sdk.monitor', ['ag.sdk.utilities']);

sdkMonitorApp.factory('queueService', ['$q', 'promiseService', function ($q, promiseService) {
    function QueueService(options, callback) {
        // Check if instance of QueueService
        if (!(this instanceof QueueService)) {
            return new QueueService(options, callback);
        }

        // Validate parameters
        if (typeof options === 'function') {
            callback = options;
            options = { limit: 1 };
        }
        if (typeof options !== 'object') options = { limit: 1 };
        if (typeof callback !== 'function') callback = angular.noop;

        var _queue = [];
        var _limit = options.limit || 1;
        var _progress = {
            total: 0,
            complete: 0
        };

        // Private Functions
        var _next = function () {
            _limit++;

            if (_progress.complete < _progress.total) {
                _progress.complete++;
            }

            pop();
        };

        var _success = _next;
        var _error = function () {
            callback({type: 'error'});

            _next();
        };

        // Public Functions
        var push = function (action, deferred) {
            _progress.total++;
            _queue.push([action, deferred]);

            pop();
        };

        var pop = function () {
            callback({type: 'progress', percent: (100.0 / _progress.total) * _progress.complete});

            console.log('QUEUE TOTAL: ' + _progress.total + ' COMPLETE: ' + _progress.complete + ' PERCENT: ' + (100.0 / _progress.total) * _progress.complete);

            if (_queue.length === 0 && _progress.total === _progress.complete) {
                _progress.total = 0;
                _progress.complete = 0;

                callback({type: 'complete'});
            }

            if (_limit <= 0 || _queue.length === 0) {
                return;
            }

            _limit--;

            var buffer = _queue.shift(),
                action = buffer[0],
                deferred = buffer[1];

            deferred.promise.then(_success, _error);

            action(deferred);
        };

        var clear = function () {
            _progress.total = 0;
            _progress.complete = 0;
            _queue.length = 0;
        };

        var wrapPush = function (action) {
            var deferred = promiseService.defer();

            push(action, deferred);

            return deferred.promise;
        };

        return {
            wrapPush: wrapPush,
            push: push,
            pop: pop,
            clear: clear
        }
    }

    return function (options, callback) {
        return new QueueService(options, callback);
    };
}]);

sdkMonitorApp.factory('promiseMonitor', ['safeApply', function (safeApply) {
    function PromiseMonitor(callback) {
        if (!(this instanceof PromiseMonitor)) {
            return new PromiseMonitor(callback);
        }

        var _stats = {
            total: 0,
            complete: 0,
            resolved: 0,
            rejected: 0,
            percent: 0
        };

        var _completePromise = function () {
            _stats.complete++;
            _stats.percent = (100.0 / _stats.total) * _stats.complete;

            console.log('MONITOR TOTAL: ' + _stats.total + ' COMPLETE: ' + _stats.complete + ' PERCENT: ' + _stats.percent);

            safeApply(function () {
                if (_stats.complete == _stats.total) {
                    callback({type: 'complete', percent: _stats.percent, stats: _stats});
                } else {
                    callback({type: 'progress', percent: _stats.percent, stats: _stats});
                }
            });
        };

        return {
            stats: function () {
                return _stats;
            },
            clear: function () {
                _stats = {
                    total: 0,
                    complete: 0,
                    resolved: 0,
                    rejected: 0,
                    percent: 0
                };
            },
            add: function (promise) {
                _stats.total++;

                promise.then(function (res) {
                    _stats.resolved++;

                    _completePromise();
                }, function (err) {
                    _stats.rejected++;

                    safeApply(function () {
                        callback({type: 'error'}, err);
                    });

                    _completePromise();
                });

                return promise;
            }
        };
    }

    return function (callback) {
        return new PromiseMonitor(callback);
    }
}]);

var skdUtilitiesApp = angular.module('ag.sdk.utilities', []);

skdUtilitiesApp.run(['stateResolver', function (stateResolver) {
    // Initialize stateResolver
}]);

skdUtilitiesApp.provider('stateResolver', function () {
    var _stateTable = {};

    this.when = function (states, resolverInjection) {
        if (states instanceof Array) {
            angular.forEach(states, function (state) {
                _stateTable[state] = resolverInjection;
            })
        } else {
            _stateTable[states] = resolverInjection;
        }

        return this;
    };

    this.resolver = function () {
        return {
            data: ['stateResolver', function (stateResolver) {
                return stateResolver.getData();
            }]
        }
    };

    this.$get = ['$rootScope', '$state', '$injector', function ($rootScope, $state, $injector) {
        var nextState = undefined;

        $rootScope.$on('$stateChangeStart', function (event, toState) {
            nextState = toState;
        });

        return {
            getData: function () {
                return (nextState && _stateTable[nextState.name] ? $injector.invoke(_stateTable[nextState.name]) : undefined);
            }
        }
    }];
});


skdUtilitiesApp.factory('safeApply', ['$rootScope', function ($rootScope) {
    return function (fn) {
        if ($rootScope.$$phase) {
            fn();
        } else {
            $rootScope.$apply(fn);
        }
    };
}]);

skdUtilitiesApp.factory('dataMapService', [function() {
    return function(items, mapping, excludeId) {
        var mappedItems = [];

        if (items instanceof Array === false) {
            items = (items !== undefined ? [items] : []);
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var mappedItem;

            if (typeof mapping === 'function') {
                mappedItem = mapping(item);
            } else {
                mappedItem = {};

                for (var key in mapping) {
                    if (mapping.hasOwnProperty(key)) {
                        mappedItem[key] = item[mapping[key]];
                    }
                }
            }

            if (mappedItem instanceof Array) {
                mappedItems = mappedItems.concat(mappedItem);
            } else if (typeof mappedItem === 'object') {
                if (excludeId !== true) {
                    mappedItem.id = mappedItem.id || item.id;
                }

                mappedItems.push(mappedItem);
            } else if (mappedItem !== undefined) {
                mappedItems.push(mappedItem);
            }
        }

        return mappedItems;
    }
}]);

skdUtilitiesApp.factory('pagingService', ['$rootScope', '$http', 'promiseService', 'dataMapService', function($rootScope, $http, promiseService, dataMapService) {
    return {
        initialize: function(requestor, dataMap, itemStore) {
            itemStore = itemStore || function (data) {
                $rootScope.$broadcast('paging::items', data);
            };

            var _scroll = {
                page: {limit: 50},
                busy: false,
                complete: false,
                disabled: function() {
                    return (_scroll.busy || _scroll.complete);
                },
                request: function() {
                    return promiseService.wrap(function(promise) {
                        _scroll.busy = true;

                        requestor(_scroll.page).then(function(res) {
                            _scroll.page = res.paging;
                            _scroll.complete = (_scroll.page === undefined);
                            _scroll.busy = false;

                            if (_scroll.page !== undefined) {
                                res = res.data;
                            }

                            if (dataMap) {
                                res = dataMapService(res, dataMap);
                            }

                            itemStore(res);

                            promise.resolve(res);
                        }, promise.reject);
                    });
                }
            };

            return _scroll;
        },
        page: function(endPoint, paging) {
            return promiseService.wrap(function(promise) {
                var _handleResponse = function (res) {
                    promise.resolve(res.data);
                };

                if (paging !== undefined) {
                    if (typeof paging === 'string') {
                        $http.get(paging, {withCredentials: true}).then(_handleResponse, promise.reject);
                    } else {
                        $http.get(endPoint, {params: paging, withCredentials: true}).then(_handleResponse, promise.reject);
                    }
                } else {
                    $http.get(endPoint, {withCredentials: true}).then(_handleResponse, promise.reject);
                }
            });
        }
    };
}]);

skdUtilitiesApp.factory('promiseService', ['$q', 'safeApply', function ($q, safeApply) {
    var _defer = function() {
        var deferred = $q.defer();

        return {
            resolve: function (response) {
                safeApply(function () {
                    deferred.resolve(response);
                });

            },
            reject: function (response) {
                safeApply(function () {
                    deferred.reject(response);
                });

            },
            promise: deferred.promise
        }
    };

    var _wrapAll = function (action, init) {
        var list = init;

        action(list);

        return $q.all(list);
    };
    
    return {
        all: function (promises) {
            return $q.all(promises);
        },
        wrap: function(action) {
            var deferred = _defer();

            action(deferred);

            return deferred.promise;
        },
        wrapAll: function (action) {
            return _wrapAll(action, []);
        },
        arrayWrap: function (action) {
            return _wrapAll(action, []);
        },
        objectWrap: function (action) {
            return _wrapAll(action, {});
        },
        defer: _defer
    }
}]);

var sdkHelperAssetApp = angular.module('ag.sdk.helper.asset', ['ag.sdk.helper.farmer']);

sdkHelperAssetApp.factory('assetHelper', ['$filter', 'landUseHelper', function($filter, landUseHelper) {
    var _listServiceMap = function(item, metadata) {
        var map = {
            type: item.type,
            updatedAt: item.updatedAt
        };

        if (item.data) {
            if (item.type == 'crop') {
                map.title = (item.data.plantedArea ? item.data.plantedArea.toFixed(2) + 'Ha of ' : '') + (item.data.crop ? item.data.crop : '') + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.season ? item.data.season : '');
                map.groupby = item.farmId;
            } else if (item.type == 'farmland') {
                map.title = (item.data.portionNumber == 0 ? 'Remainder of farm' : 'Portion ' + item.data.portionNumber);
                map.subtitle = 'Area: ' + item.data.area.toFixed(2) + 'Ha';
                map.groupby = item.farmId;
            } else if (item.type == 'improvement') {
                map.title = item.data.name;
                map.subtitle = item.data.type + ' - ' + item.data.category;
                map.summary = (item.data.description || '');
                map.groupby = item.farmId;
            } else if (item.type == 'irrigated cropland') {
                map.title = item.data.irrigation + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = 'Equipped Area: ' + item.data.size.toFixed(2) + 'Ha';
                map.groupby = item.farmId;
            } else if (item.type == 'livestock') {
                map.title = item.data.type + ' - ' + item.data.category;
                map.subtitle = (item.data.breed ? item.data.breed + ' for ' : 'For ') + item.data.purpose;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'pasture') {
                map.title = (item.data.crop ? item.data.crop : 'Natural') + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.plantedDate ? 'Planted: ' + $filter('date')(item.data.plantedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'permanent crop') {
                map.title = item.data.crop + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'plantation') {
                map.title = item.data.crop + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = (item.data.establishedDate ? 'Established: ' + $filter('date')(item.data.establishedDate, 'dd/MM/yy') : '');
                map.groupby = item.farmId;
            } else if (item.type == 'vme') {
                map.title = item.data.category + (item.data.model ? ' model ' + item.data.model : '');
                map.subtitle = 'Quantity: ' + item.data.quantity;
                map.summary = (item.data.description || '');
                map.groupby = item.data.type;
            } else if (item.type == 'water right') {
                map.title = item.data.waterSource + (item.data.fieldName ? ' on field ' + item.data.fieldName : '');
                map.subtitle = 'Irrigatable Extent: ' + item.data.size.toFixed(2) + 'Ha';
                map.groupby = item.farmId;
            }

            if (item.data.attachments) {
                var validImages = ['png', 'jpg', 'jpeg', 'gif'];

                for (var i = 0; i < item.data.attachments.length; i++) {
                    var attachment = item.data.attachments[i];

                    for (var x = 0; x < validImages.length; x++) {
                        if (attachment.key.indexOf(validImages[x]) != -1) {
                            map.image = attachment.src;
                        }
                    }
                }
            }
        }

        if (metadata) {
            map = _.extend(map, metadata);
        }

        return map;
    };

    var _assetTypes = {
        'crop': 'Crops',
        'farmland': 'Farmlands',
        'improvement': 'Fixed Improvements',
        'irrigated cropland': 'Irrigated Cropland',
        'livestock': 'Livestock',
        'pasture': 'Pastures',
        'permanent crop': 'Permanent Crops',
        'plantation': 'Plantations',
        'vme': 'Vehicles, Machinery & Equipment',
        'water right': 'Water Rights'
    };

    var _assetSubtypes = {
        'improvement': ['Livestock & Game', 'Crop Cultivation & Processing', 'Residential', 'Business','Equipment & Utilities','Infrastructure','Recreational & Misc.'],
        'livestock': ['Cattle', 'Sheep', 'Pigs', 'Chickens', 'Ostriches', 'Goats'],
        'vme': ['Vehicles', 'Machinery', 'Equipment']
    };

    var _assetCategories = {
        improvement: {
            'Livestock & Game': ['Abattoir','Animal Cages','Animal Camp','Animal Feedlot','Animal Growing House','Animal Handling Equiment','Animal Handling Facility','Animal Pens','Animal Sale Facility','Animal Shelter','Animal Stable','Anti-Poaching Training Facility','Arena','Auction Facilities','Aviary','Barn','Beekeeping Room','Bottling Facility','Breeding Facility','Broiler House','Broiler House - Atmosphere','Broiler House - Semi','Broiler Unit','Cheese Factory','Chicken Coop','Chicken Run','Cooling Facility','Crocodile Dams','Dairy','Deboning Room','Dry Oven','Dry Storage','Drying Facility','Drying Ovens','Drying Racks','Drying Strips','Drying Tunnels','Egg Grading Facility','Egg Packaging Building','Elephant Enclosures','Embryo Room','Feed Dispensers','Feed Mill','Feed Storeroom','Feeding Lot','Feeding Pens','Feeding Shelter','Feeding Troughs','Filter Station','Fish Market Buildings','Flavour Shed','Game Cage Facility','Game Lodge','Game Pens','Game Room','Game Slaughter Area','Game Viewing Area','Grading Room','Handling Facilities','Hatchery','Hide Store','Hing Pen','Horse Walker','Hunters','Hide Storeroom','Inspection Room','Kennels','Kraal','Laying Hen House','Maternity House','Maternity Pens','Meat Processing Facility','Milk Bottling Plant','Milk Tank Room','Milking Parlour','Other','Packaging Complex','Packaging Facility','Paddocks','Pasteurising Facility','Pens','Pig Sty','Poison Store','Post-Feeding Shed','Processing Facility','Quarantine Area','Racing Track','Rankin Game','Refrigeration Facility','Rehab Facility','Saddle Room','Sales Facility','Selling Kraal','Shearing Facility','Shed','Shelter','Shooting Range','Skinning Facility','Slaughter Facility','Sorting Facility','Stable','Stall','Stock Handling Facility','Storage Facility','Sty','Surgery','Treatment Area','Trout Dam','Warehouse'],
            'Crop Cultivation & Processing': ["Crop Cultivation & Processing","Barrel Maturation Room","Bottling Facility","Carton Shed","Cellar","Chemical Shed","Compost Pasteurising Unit","Compost Preparing Unit","Cooling Facility","Crushing Plant","Dark Room","Degreening Room","Dehusking Shed","Dry Oven","Dry Sow House","Dry Storage","Drying Facility","Drying Ovens","Drying Racks","Drying Strips","Drying Tunnels","Farrowing House","Fertilizer Shed","Flavour Shed","Food Plant Shed","Fruit Dry Tracks","Fruit Hopper","Gardening Facility","Germination Facility","Grading Room","Grain Handling Equipment","Grain Loading Facility","Grain Mill","Grain Silos","Grain Store","Greenhouse","Grower Unit","Handling Facilities","Hopper","Hothouse","Igloo","Inspection Room","Irrigation Dam","Irrigation Pump","Irrigation Reservoir","Irrigation System","Mill","Milling Store","Mushroom Cultivation Building","Mushroom Sweat Room","Nursery (Plant)","Nut Cracking Facility","Nut Factory","Oil Store","Onion Drying Shed","Other","Packaging Complex","Packaging Facility","Pesticide Store","Poison Store","Processing Facility","Refrigeration Facility","Sales Facility","Seed Store","Seedling Growing Facility","Seedling Packaging Facility","Shed","Silo","Sorting Facility","Sprinklers","Storage Facility","Tea Drying Facility","Tea Room","Tobacco Dryers","Warehouse","Wine Cellar","Wine Storage Shed","Wine Tanks","Winery Building"],
            'Residential': ["Ablution Facility","Accommodation Units","Attic","Balcony","Bathroom","Bedroom","Building","Bungalow","Bunk House","Cabin","Camp Accommodation","Canteen","Caretaker's Dwelling","Chalet","Cloak Room","Community Dwelling","Cottage","Dining Area","Dining Facility","Dormitory","Dressing Rooms","Drivers' Accommodation","Dwelling","Estate House","Flat","Foreman's Dwelling","Game Lodge","Guest Accommodation","Homestead","Hostels","House","Hunters' Accommodation","Hunters' Kitchen","Hut","Kitchen","Lapa","Lean-to","Lodge","Loft","Log Cabin","Longdavel","Lounge","Luncheon Areas","Luxury Accommodation","Manager's Dwelling","Manor House","Maternity House","Other","Owner's Dwelling","Parlor","Shed","Shower","Staff Ablutions","Staff Accommodation","Staff Building","Staff Compound","Staff Dining Facility","Stoop","Tavern","Teachers' Dwellings","Toilet - Outdoor","Toilet Block","Toilets","Toilets - Staff","Veranda","Winemakers' Dwelling","Workers' Ablutions","Workers' Accommodation","Workers' Kitchen","Workers' School"],
            'Business': ["Ablution Facility","Administration Block","Administrative Building","Administrative Offices","Animal Sale Facility","Auction Facilities","Barrel Maturation Room","Bathroom","Bottling Facility","Building","Charcoal Factory","Cheese Factory","Cloak Room","Cloth House","Commercial Buildings","Conference Facility","Cooling Facility","Distribution Centre","Factory Building","Fish Market Buildings","Functions Centre","Furniture Factory","Grading Room","Industrial Warehouse","Inspection Room","Ironing Room","Kiosk","Laboratory","Laundry Facility","Lean-to","Liquor Store","Loading Area","Loading Bay","Loading Platform","Loading Shed","Locker Room","Lockup Shed","Mechanical Workshop","Office","Office Building","Office Complex","Other","Packaging Complex","Packaging Facility","Pallet Factory","Pallet Stacking Area","Pill Factory","Processing Facility","Reception Area","Refrigeration Facility","Sales Facility","Saw Mill","Security Office","Shed","Shop","Sorting Facility","Staff Building","Staff Compound","Storage Facility","Studio","Toilet - Outdoor","Toilet Block","Toilets","Toilets - Client","Toilets - Office","Toilets - Staff","Transport Depot","Warehouse","Wine Cellar","Wine Shop","Wine Tasting Room","Winery Building","Work Station","Workers' Ablutions","Workers' Accommodation","Workers' Kitchen","Workers' School","Workshop"],
            'Equipment & Utilities': ["Air Conditioners","Aircraft Hangar","Backup Generator","Boiler Room","Borehole","Borehole - Equipped","Borehole - Pump","Bulk Tank Room","Caravan Room","Carport","Carport - Double","Carton Shed","Chemical Shed","Compressor Room","Control Hut","Cooling Facility","Diesel Room","Electricity Room","Engine Room","Equipment Stores","Eskom Transformer","Filter Station","Fuel Depot","Fuel Store","Fuel Tank","Garage","Garage - Double","Garage - Triple","Generator Room","Hangar","Helipad","Hydro Tanks","Hydrophonic Pond","Laying Hen House Equipment","Machinery Room","Mechanical Workshop","Oil Store","Other","Oven","Petrol Storage","Poison Store","Power Room","Pump","Pump House Equipment","Pumphouse","Refuelling Canopy","Scale","Shed","Solar Power Room","Tank Stand","Tanks","Tool Shed","Tractor Shed","Transformer Room","Transport Depot","Truck Shelter","Truck Wash","Turbine Room","Twin Engine Generator Unit","Tyre Shed","Utility Building","Utility Room","Water Purification Plant","Water Reticulation Works","Water Storage Tanks","Water Tower"],
            'Infrastructure': ["Ablution Facility","Access Roads","All Infrastructure","Attic","Balcony","Barn","Bathroom","Bedroom","Bell Arch","Bin Compartments","Boiler Room","Borehole","Borehole - Equipped","Borehole - Pump","Building","Bulk Tank Room","Bunker","Canopy","Canteen","Cellar","Classroom","Cloak Room","Concrete Slab","Concrete Surfaces","Courtyard","Covered Area","Dam","Dam - Filter","Debris Filter Pond","Deck","Driveway","Electric Fencing","Electric Gate","Electricity Room","Entrance Building","Entrance Gate","Fencing","Fencing (Game)","Fencing (Perimeter)","Fencing (Security)","Flooring","Foyer","Gate","Gate - Sliding","Gate House","Gazebo","Guardhouse","Hall","House","Hut","Hydro Tanks","Hydrophonic Pond","Infrastructure","Irrigation Dam","Irrigation Pump","Irrigation Reservoir","Irrigation System","Kiosk","Kitchen","Koi Pond","Kraal","Laboratory","Landing Strip","Laundry Facility","Lean-to","Lockup Shed","Longdavel","Mezzanine","Other","Outbuilding","Outdoor Room","Outhouse","Parking Area","Parlor","Patio","Paving","Pens","Poles","Pool Facility","Pool House","Porch","Porte Cochere","Reservoir","Reservoir Pumphouse","Reservoir Tower","Road Stall","Rondavel","Roofing","Room","Ruin","Runway","Security Office","Shade Netting","Shade Port","Shed","Shooting Range","Shower","Silo","Slab","Splash Pool","Sprinklers","Stable","Stoop","Storage Facility","Studio","Surrounding Works","Tarmac","Tarred Area","Tarred Road Surfaces","Terrace","Toilet - Outdoor","Toilet Block","Toilets","Toilets - Client","Toilets - Office","Toilets - Staff","Trench","Tunnel","Tunnel Building","Vacant Areas","Veranda","Walkways","Walls","Walls (Boundary)","Walls (Retaining)","Walls (Security)","Warehouse","Water Feature","Water Storage Tanks","Water Tower","Wire Enclosures","Work Station"],
            'Recreational & Misc.': ["Anti-Poaching Training Facility","Archive Room","Arena","Art Gallery","Bar","Barrel Maturation Room","BBQ","BBQ Facility","Café","Canteen","Caravan Room","Chapel","Church","Church Facility","Classroom","Cloth House","Clubhouse","Coffee Shop","Community Centre","Compost Pasteurising Unit","Compost Preparing Unit","Dark Room","Entertainment Area","Entertainment Facility","Functions Centre","Funeral Building","Furniture Factory","Gallery","Game Room","Golf Clubhouse","Gymnasium","Helipad","Hydro Tanks","Hydrophonic Pond","Igloo","Ironing Room","Jacuzzi","Judging Booth","Kiosk","Koi Pond","Laundry Facility","Liquor Store","Locker Room","Lounge","Luncheon Areas","Museum","Nursery School","Nursing Home","Other","Parlor","Pill Factory","Play Area","Pool Facility","Pool House","Pottery Room","Pub","Reception Area","Recreation Facility","Rehab Facility","Restaurant","Retirement Centre","Salon","Sauna","Saw Mill","School","Spa Baths","Spa Complex","Splash Pool","Squash Court","Sulphur Room","Surgery","Swimming Pool - Indoor","Swimming Pool - Outdoor","Swimming Pool Ablution","Tavern","Tea Room","Tennis Court","Treatment Area","Trout Dam","Venue Hall","Vitamin Room","Wedding Venue","Weigh Bridge","Weigh Bridge Control Room","Wellness Centre","Windmill"
            ]
        },
        'livestock': {
            Cattle: {
                Breeding: ['Phase A Bulls', 'Phase B Bulls', 'Phase C Bulls', 'Phase D Bulls', 'Heifers', 'Bull Calves', 'Heifer Calves', 'Tollies 1-2', 'Heifers 1-2', 'Culls'],
                Dairy: ['Bulls', 'Dry Cows', 'Lactating Cows', 'Heifers', 'Calves', 'Culls'],
                Slaughter: ['Bulls', 'Cows', 'Heifers', 'Weaners', 'Calves', 'Culls']
            },
            Sheep: {
                Breeding: ['Rams', 'Young Rams', 'Ewes', 'Young Ewes', 'Lambs', 'Wethers', 'Culls'],
                Slaughter: ['Rams', 'Ewes', 'Lambs', 'Wethers', 'Culls']
            },
            Pigs: {
                Slaughter: ['Boars', 'Breeding Sows', 'Weaned pigs', 'Piglets', 'Porkers', 'Baconers', 'Culls']
            },
            Chickens: {
                Broilers: ['Day Old Chicks', 'Broilers'],
                Layers: ['Hens', 'Point of Laying Hens', 'Culls']
            },
            Ostriches: {
                Slaughter: ['Breeding Stock', 'Slaughter Birds > 3 months', 'Slaughter Birds < 3 months', 'Chicks']
            },
            Goats: {
                Slaughter: ['Rams', 'Breeding Ewes', 'Young Ewes', 'Kids']
            }
        },
        'vme': {
            Vehicles: ['Bakkie', 'Car', 'Truck', 'Tractor'],
            Machinery: ['Mower', 'Mower Conditioner', 'Hay Rake', 'Hay Baler', 'Harvester'],
            Equipment: ['Plough', 'Harrow', 'Ridgers', 'Rotovator', 'Cultivator', 'Planter', 'Combine', 'Spreader', 'Sprayer', 'Mixer']
        }
    };

    var _conditionTypes = ['Good', 'Good to fair', 'Fair', 'Fair to poor', 'Poor'];

    var _assetPurposes = {
        livestock: {
            Cattle: ['Breeding', 'Dairy', 'Slaughter'],
            Sheep: ['Breeding', 'Slaughter'],
            Pigs: ['Slaughter'],
            Chickens: ['Broilers', 'Layers'],
            Ostriches:['Slaughter'],
            Goats: ['Slaughter']
        }
    };

    var _seasonTypes = ['Cape', 'Summer', 'Fruit', 'Winter'];

    var _assetLandUse = {
        'crop': ['Cropland'],
        'farmland': landUseHelper.landUseTypes(),
        'improvement': [],
        'irrigated cropland': ['Cropland'],
        'livestock': ['Grazing', 'Planted Pastures', 'Conservation'],
        'pasture': ['Grazing', 'Planted Pastures', 'Conservation'],
        'permanent crop': ['Horticulture (Perennial)'],
        'plantation': ['Plantation'],
        'vme': [],
        'water right': landUseHelper.landUseTypes()
    }

    return {
        assetTypes: function() {
            return _assetTypes;
        },
        seasonTypes: function () {
            return _seasonTypes;
        },
        listServiceMap: function () {
            return _listServiceMap;
        },
        getAssetTitle: function (assetType) {
            return _assetTypes[assetType];
        },
        getAssetSubtypes: function(type) {
            return _assetSubtypes[type] || [];
        },
        getAssetCategories: function(type, subtype) {
            return (_assetCategories[type] ? (_assetCategories[type][subtype] || []) : []);
        },
        getAssetPurposes: function(type, subtype) {
            return (_assetPurposes[type] ? (_assetPurposes[type][subtype] || []) : []);
        },
        conditionTypes: function () {
            return _conditionTypes;
        },

        isFieldApplicable: function (type, field) {
            var fieldHasLandUse = (_assetLandUse[type].indexOf(field.landUse) !== -1);

            if (type == 'irrigated cropland') {
                return (fieldHasLandUse && field.irrigated);
            }

            return fieldHasLandUse;
        },

        cleanAssetData: function (asset) {
            if (asset.type == 'vme') {
                asset.data.quantity = (asset.data.identificationNo && asset.data.identificationNo.length > 0 ? 1 : asset.data.quantity);
                asset.data.identificationNo = (asset.data.quantity != 1 ? '' : asset.data.identificationNo);
            }

            return asset;
        },
        calculateValuation: function (asset, valuation) {
            if (asset.type == 'vme' && isNaN(asset.data.quantity) == false) {
                valuation.assetValue = asset.data.quantity * (valuation.unitValue || 0);
            } else if (asset.type == 'livestock' && isNaN(valuation.totalStock) == false) {
                valuation.assetValue = valuation.totalStock * (valuation.unitValue || 0);
            } else if (asset.type == 'crop' && isNaN(valuation.expectedYield) == false) {
                valuation.assetValue = valuation.expectedYield * (valuation.unitValue || 0);
            } else if (asset.type != 'improvement' && isNaN(asset.data.size) == false) {
                valuation.assetValue = asset.data.size * (valuation.unitValue || 0);
            }

            return valuation;
        }
    }
}]);

var sdkHelperDocumentApp = angular.module('ag.sdk.helper.document', []);

sdkHelperDocumentApp.provider('documentHelper', function () {
    var _docTypes = [];
    var _documentMap = {};

    var _pluralMap = function (item, count) {
        return (count != 1 ? (item.lastIndexOf('y') == item.length - 1 ? item.substr(0, item.length - 1) + 'ies' : item + 's') : item);
    };

    this.registerDocuments = function (docs) {
        if ((docs instanceof Array) === false) docs = [docs];

        angular.forEach(docs, function (doc) {
            if (_docTypes.indexOf(doc.docType) === -1) {
                _docTypes.push(doc.docType);
            }

            // Allow override of document
            doc.state = doc.state || 'document.' + doc.docType.replace(' ', '-');
            _documentMap[doc.docType] = doc;
        });
    };

    this.getDocument = function (docType) {
        return _documentMap[docType];
    };

    this.$get = ['$injector', function ($injector) {
        var _listServiceMap = function (item) {
            var docMap = _documentMap[item.docType];
            var map = {
                title: (item.author ? item.author : ''),
                subtitle: '',
                docType: item.docType,
                updatedAt: item.updatedAt
            };

            if (item.organization && item.organization.name) {
                map.subtitle = (item.author ? 'From ' + item.author + ': ' : '');
                map.title = item.organization.name;
            }

            if (item.data && docMap && docMap.listServiceMap) {
                if (docMap.listServiceMap instanceof Array) {
                    docMap.listServiceMap = $injector.invoke(docMap.listServiceMap);
                }

                docMap.listServiceMap(map, item);
            }

            return map;
        };

        return {
            listServiceMap: function () {
                return _listServiceMap;
            },
            pluralMap: function (item, count) {
                return _pluralMap(item, count);
            },

            documentTypes: function () {
                return _docTypes;
            },
            documentTitles: function () {
                return _.pluck(_documentMap, 'title');
            },

            getDocumentTitle: function (docType) {
                return (_documentMap[docType] ? _documentMap[docType].title : undefined);
            },
            getDocumentState: function (docType) {
                return (_documentMap[docType] ? _documentMap[docType].state : undefined);
            },
            getDocumentMap: function (docType) {
                return _documentMap[docType];
            }
        }
    }]
});

var sdkHelperFarmerApp = angular.module('ag.sdk.helper.farmer', ['ag.sdk.interface.map']);

sdkHelperFarmerApp.factory('farmerHelper', ['geoJSONHelper', function(geoJSONHelper) {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.operationType,
            profileImage : item.profilePhotoSrc,
            searchingIndex: searchingIndex(item)
        };
        
        function searchingIndex(item) {
            var index = [];
            item.legalEntities.forEach(function(entity) {
                index.push(entity.name);
                
                if(entity.registrationNumber) {
                    index.push(entity.registrationNumber);
                }
            });
            return index;
        }
    };

    var _businessEntityTypes = ['Commercial', 'Cooperative', 'Corporate', 'Smallholder'];

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        businessEntityTypes: function() {
            return _businessEntityTypes;
        },
        getFarmerLocation: function(farmer) {
            if (farmer) {
                if (farmer.data && farmer.data.loc) {
                    return farmer.data.loc.coordinates;
                } else if (farmer.legalEntities) {
                    var geojson = geoJSONHelper();

                    angular.forEach(farmer.legalEntities, function (entity) {
                        if (entity.assets) {
                            angular.forEach(entity.assets, function (asset) {
                                geojson.addGeometry(asset.loc);
                            });
                        }
                    });

                    return geojson.getCenter();
                }
            }

            return null;
        }
    }
}]);

sdkHelperFarmerApp.factory('legalEntityHelper', [function() {
    var _listServiceMap = function(item) {
        return {
            title: item.name,
            subtitle: item.type
        };
    };

    var _legalEntityTypes = ['Individual', 'Sole Proprietor', 'Close Corporation', 'Trust', 'Party Limited Company', 'Co-operative', 'Partnership', 'State Owned Company', 'Association'];

    var _enterpriseTypes = {
        'Field Crops': ['Barley', 'Cabbage', 'Canola', 'Chicory', 'Citrus (Hardpeel)', 'Cotton', 'Cow Peas', 'Dry Bean', 'Dry Grapes', 'Dry Peas', 'Garlic', 'Grain Sorghum', 'Green Bean', 'Ground Nut', 'Hybrid Maize Seed', 'Lentils', 'Lucerne', 'Maize (Fodder)', 'Maize (Green)', 'Maize (Seed)', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Onion', 'Onion (Seed)', 'Popcorn', 'Potato', 'Pumpkin', 'Rye', 'Soya Bean', 'Sugar Cane', 'Sunflower', 'Sweetcorn', 'Tobacco', 'Tobacco (Oven dry)', 'Tomatoes', 'Watermelon', 'Wheat'],
        'Horticulture': ['Almonds', 'Apples', 'Apricots', 'Avo', 'Avocado', 'Bananas', 'Cherries', 'Chilli', 'Citrus (Hardpeel Class 1)', 'Citrus (Softpeel)', 'Coffee', 'Figs', 'Grapes (Table)', 'Grapes (Wine)', 'Guavas', 'Hops', 'Kiwi Fruit', 'Lemons', 'Macadamia Nut', 'Mango', 'Mangos', 'Melons', 'Nectarines', 'Olives', 'Oranges', 'Papaya', 'Peaches', 'Peanut', 'Pears', 'Pecan Nuts', 'Persimmons', 'Pineapples', 'Pistachio Nuts', 'Plums', 'Pomegranates', 'Prunes', 'Quinces', 'Rooibos', 'Strawberries', 'Triticale', 'Watermelons'],
        'Livestock': ['Cattle (Extensive)', 'Cattle (Feedlot)', 'Cattle (Stud)', 'Chicken (Broilers)', 'Chicken (Layers)', 'Dairy', 'Game', 'Goats', 'Horses', 'Ostrich', 'Pigs', 'Sheep (Extensive)', 'Sheep (Feedlot)', 'Sheep (Stud)']
    };

    /**
     * @name EnterpriseEditor
     * @param enterprises
     * @constructor
     */
    function EnterpriseEditor (enterprises) {
        this.enterprises = enterprises || [];

        this.selection = {
            category: undefined,
            item: undefined
        }
    }

    EnterpriseEditor.prototype.addEnterprise = function (enterprise) {
        enterprise = enterprise || this.selection.item;

        if (this.enterprises.indexOf(enterprise) == -1) {
            this.enterprises.push(enterprise);
            this.selection.item = undefined;
        }
    };

    EnterpriseEditor.prototype.removeEnterprise = function (item) {
        if (typeof item == 'string') {
            item = this.enterprises.indexOf(item);
        }

        if (item !== -1) {
            this.enterprises.splice(item, 1);
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        legalEntityTypes: function() {
            return _legalEntityTypes;
        },
        enterpriseTypes: function () {
            return _enterpriseTypes;
        },

        enterpriseEditor: function (enterprises) {
            return new EnterpriseEditor(enterprises);
        }
    }
}]);

sdkHelperFarmerApp.factory('landUseHelper', function() {
    var _croppingPotentialTypes = ['High', 'Medium', 'Low'];
    var _effectiveDepthTypes = ['0 - 30cm', '30 - 60cm', '60 - 90cm', '90 - 120cm', '120cm +'];
    var _irrigationTypes = ['Centre-Pivot', 'Flood', 'Micro', 'Sub-drainage', 'Sprinkler', 'Drip'];
    var _landUseTypes = ['Cropland', 'Grazing', 'Horticulture (Intensive)', 'Horticulture (Perennial)', 'Horticulture (Seasonal)', 'Housing', 'Plantation', 'Planted Pastures', 'Structures (Handling)', 'Structures (Processing)', 'Structures (Storage)', 'Utilities', 'Wasteland', 'Conservation'];
    var _soilTextureTypes = ['Sand', 'Loamy Sand', 'Clay Sand', 'Sandy Loam', 'Fine Sandy Loam', 'Loam', 'Silty Loam', 'Sandy Clay Loam', 'Clay Loam', 'Clay', 'Gravel', 'Other', 'Fine Sandy Clay', 'Medium Sandy Clay Loam', 'Fine Sandy Clay Loam', 'Loamy Medium Sand', 'Medium Sandy Loam', 'Coarse Sandy Clay Loam', 'Coarse Sand', 'Loamy Fine Sand', 'Loamy Coarse Sand', 'Fine Sand', 'Silty Clay', 'Coarse Sandy Loam', 'Medium Sand', 'Medium Sandy Clay', 'Coarse Sandy Clay', 'Sandy Clay'];
    var _terrainTypes = ['Plains', 'Mountains'];
    var _waterSourceTypes = ['Irrigation Scheme', 'River', 'Dam', 'Borehole'];

    var _landUseCropTypes = {
        'Cropland': ['Barley', 'Bean', 'Bean (Broad)', 'Bean (Dry)', 'Bean (Sugar)', 'Bean (Green)', 'Bean (Kidney)', 'Canola', 'Cassava', 'Cotton', 'Cowpea', 'Grain Sorghum', 'Groundnut', 'Maize', 'Maize (White)', 'Maize (Yellow)', 'Oats', 'Pearl Millet', 'Potato', 'Rape', 'Rice', 'Rye', 'Soybean', 'Sunflower', 'Sweet Corn', 'Sweet Potato', 'Tobacco', 'Triticale', 'Wheat', 'Wheat (Durum)'],
        'Grazing': ['Bahia-Notatum', 'Bottle Brush', 'Buffalo', 'Buffalo (Blue)', 'Buffalo (White)', 'Bush', 'Cocksfoot', 'Common Setaria', 'Dallis', 'Phalaris', 'Rescue', 'Rhodes', 'Smuts Finger', 'Tall Fescue', 'Teff', 'Veld', 'Weeping Lovegrass'],
        'Horticulture (Perennial)': ['Almond', 'Aloe', 'Apple', 'Apricot', 'Avocado', 'Banana', 'Cherry', 'Coconut', 'Coffee', 'Grape', 'Grape (Bush Vine)', 'Grape (Red)', 'Grape (Table)', 'Grape (White)', 'Grapefruit', 'Guava', 'Hops', 'Kiwi Fruit', 'Lemon', 'Litchi', 'Macadamia Nut', 'Mandarin', 'Mango', 'Nectarine', 'Olive', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pecan Nut', 'Persimmon', 'Pineapple', 'Pistachio Nut', 'Plum', 'Rooibos', 'Sisal', 'Sugarcane', 'Tea', 'Walnuts'],
        'Horticulture (Seasonal)': ['Asparagus', 'Beet', 'Beetroot', 'Blackberry', 'Borecole', 'Brinjal', 'Broccoli', 'Brussel Sprout', 'Cabbage', 'Cabbage (Chinese)', 'Cabbage (Savoy)', 'Cactus Pear', 'Carrot', 'Cauliflower', 'Celery', 'Chicory', 'Chilly', 'Cucumber', 'Cucurbit', 'Dry Pea', 'Garlic', 'Ginger', 'Granadilla', 'Kale', 'Kohlrabi', 'Leek', 'Lespedeza', 'Lettuce', 'Makataan', 'Mustard', 'Mustard (White)', 'Onion', 'Paprika', 'Parsley', 'Parsnip', 'Pea', 'Pepper', 'Pumpkin', 'Quince', 'Radish', 'Squash', 'Strawberry', 'Swede', 'Sweet Melon', 'Swiss Chard', 'Tomato', 'Turnip', 'Vetch (Common)', 'Vetch (Hairy)', 'Watermelon', 'Youngberry'],
        'Plantation': ['Bluegum', 'Pine', 'Wattle'],
        'Planted Pastures': ['Birdsfoot Trefoil', 'Carribean Stylo', 'Clover', 'Clover (Arrow Leaf)', 'Clover (Crimson)', 'Clover (Persian)', 'Clover (Red)', 'Clover (Rose)', 'Clover (Strawberry)', 'Clover (Subterranean)', 'Clover (White)', 'Kikuyu', 'Lucerne', 'Lupin', 'Lupin (Narrow Leaf)', 'Lupin (White)', 'Lupin (Yellow)', 'Medic', 'Medic (Barrel)', 'Medic (Burr)', 'Medic (Gama)', 'Medic (Snail)', 'Medic (Strand)', 'Ryegrass', 'Ryegrass (Hybrid)', 'Ryegrass (Italian)', 'Ryegrass (Westerwolds)', 'Serradella', 'Serradella (Yellow)', 'Silver Leaf Desmodium'],
    };

    return {
        croppingPotentialTypes: function () {
            return _croppingPotentialTypes;
        },
        effectiveDepthTypes: function () {
            return _effectiveDepthTypes;
        },
        irrigationTypes: function () {
            return _irrigationTypes;
        },
        landUseTypes: function () {
            return _landUseTypes;
        },
        soilTextureTypes: function () {
            return _soilTextureTypes;
        },
        terrainTypes: function () {
            return _terrainTypes;
        },
        waterSourceTypes: function () {
            return _waterSourceTypes;
        },

        getCropsForLandUse: function (landUse) {
            return _landUseCropTypes[landUse] || [];
        },

        isCroppingPotentialRequired: function (landUse) {
            return (landUse == 'Cropland');
        },
        isTerrainRequired: function (landUse) {
            return (landUse == 'Grazing');
        }

    }
});

sdkHelperFarmerApp.factory('farmHelper', [function() {
    var _listServiceMap = function(item) {
        return {
            title: item.name
        };
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        }
    }
}]);

var sdkHelperFavouritesApp = angular.module('ag.sdk.helper.favourites', ['ag.sdk.helper.document', 'ag.sdk.helper.task']);

sdkHelperFavouritesApp.factory('activityHelper', ['documentHelper', function(documentHelper) {
    var _listServiceMap = function(item) {
        var map = {
            date: item.date
        };

        if (typeof item.actor === 'object') {
            // User is the actor
            if (item.actor.displayName) {
                map.title = item.actor.displayName;
                map.subtitle = item.actor.displayName;
            }
            else {
                map.title = item.actor.firstName + ' ' + item.actor.lastName;
                map.subtitle = item.actor.firstName + ' ' + item.actor.lastName;
            }

            if (item.actor.position) {
                map.title += ' (' + item.actor.position + ')';
            }

            map.profilePhotoSrc = item.actor.profilePhotoSrc;
        } else if (item.organization) {
            // Organization is the actor
            map.title = item.organization.name;
            map.subtitle = item.organization.name;
        } else {
            // Unknown actor
            map.title = 'Someone';
            map.subtitle = 'Someone';
        }

        map.subtitle += ' ' + _getActionVerb(item.action) + ' ';

        map.referenceId = item.referenceType == 'farmer' ? item.organization.id : item[item.referenceType + 'Id'];

        if (item.referenceType == 'farmer') {
            if (item.action == 'invite') {
                map.subtitle += item.organization.name + ' to create an Agrista account';
            } else if (item.action == 'register') {
                map.subtitle += 'your request to join Agrista';
            } else if (item.action == 'create') {
                map.subtitle += 'a customer portfolio for ' + item.organization.name;
            } else if (item.action == 'register') {
                map.subtitle += 'on Agrista';
            } else {
                map.subtitle += 'the portfolio of ' + item.organization.name;
            }

            map.referenceState = 'customer.details';
        } else {
            if (item[item.referenceType] !== undefined) {
                if (item.referenceType == 'document') {
                    map.subtitle += _getReferenceArticle(item[item.referenceType].docType) + ' ' + documentHelper.getDocumentTitle(item[item.referenceType].docType) + ' ' + item.referenceType;
                    map.referenceState = documentHelper.getDocumentState(item[item.referenceType].docType);
                } else if (item.referenceType == 'task') {
                    map.subtitle += 'the ' + taskHelper.getTaskTitle(item[item.referenceType].todo) + ' ' + item.referenceType;
                    map.referenceState = documentHelper.getTaskState(item[item.referenceType].todo);
                } else {
                    map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
                }
            } else {
                map.subtitle += _getReferenceArticle(item.referenceType) + ' ' + item.referenceType;
            }

            if (item.actor && item.organization && item.organization.name) {
                map.subtitle += ' ' + _getActionPreposition(item.action) + ' ' + item.organization.name;
            }
        }

        return map;
    };

    var _getActionPreposition = function (action) {
        return _actionPrepositionExceptionMap[action] || 'for';
    };

    var _getActionVerb = function (action) {
        return _actionVerbExceptionMap[action] || (action.lastIndexOf('e') == action.length - 1 ? action + 'd' : action + 'ed');
    };

    var _getReferenceArticle = function (reference) {
        var vowels = ['a', 'e', 'i', 'o', 'u'];

        return _referenceArticleExceptionMap[reference] || (vowels.indexOf(reference.substr(0, 1)) != -1 ? 'an' : 'a');
    };

    var _actionPrepositionExceptionMap = {
        'share': 'with',
        'sent': 'to'
    };

    var _actionVerbExceptionMap = {
        'register': 'accepted',
        'sent': 'sent'
    };

    var _referenceArticleExceptionMap = {
        'asset register': 'an'
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        getActionVerb: _getActionVerb,
        getReferenceArticle: _getReferenceArticle
    }
}]);

sdkHelperFavouritesApp.factory('notificationHelper', ['taskHelper', 'documentHelper', function (taskHelper, documentHelper) {
    var _listServiceMap = function(item) {
        var map = {
            title: item.sender,
            subtitle: _notificationMap[item.notificationType].title,
            state: _notificationState(item.notificationType, item.dataType)
        };

        if (item.dataType == 'task') {
            map.subtitle += ' ' + taskHelper.getTaskTitle(item.sharedData.todo);
        } else if (item.dataType == 'document') {
            map.subtitle +=  ' ' + documentHelper.getDocumentTitle(item.sharedData.docType);
        }

        map.subtitle += ' ' + item.dataType + (item.organization == null ? '' : ' for ' + item.organization.name);

        return map;
    };

    var _notificationState = function (notificationType, dataType) {
        var state = (_notificationMap[notificationType] ? _notificationMap[notificationType].state : 'view');

        return ('notification.' + state + '-' + dataType);
    };

    var _notificationMap = {
        'import': {
            title: 'Import',
            state: 'import'
        },
        'view': {
            title: 'View',
            state: 'view'
        },
        'reject': {
            title: 'Reassign',
            state: 'manage'
        },
        'review': {
            title: 'Review',
            state: 'view'
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },

        getNotificationState: function (notificationType, dataType) {
            return _notificationState(notificationType, dataType);
        },
        getNotificationTitle: function (notificationType) {
            return (_notificationMap[notificationType] ? _notificationMap[notificationType].title : '')
        }
    }
}]);

var sdkHelperApp = angular.module('ag.sdk.helper', ['ag.sdk.helper.asset', 'ag.sdk.helper.farmer', 'ag.sdk.helper.document', 'ag.sdk.helper.favourites', 'ag.sdk.helper.merchant', 'ag.sdk.helper.task', 'ag.sdk.helper.user']);

var sdkHelperMerchantApp = angular.module('ag.sdk.helper.merchant', []);

sdkHelperMerchantApp.factory('merchantHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.name,
            subtitle: item.primaryContact,
            status: (item.registered ? {text: 'registered', label: 'label-success'} : false)
        }
    };

    var _partnerTypes = {
        benefit: 'Benefit Partner',
        standard: 'Standard'
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        },
        partnerTypes: function() {
            return _partnerTypes;
        },
        getPartnerType: function (type) {
            return _partnerTypes[type];
        }
    }
}]);

var sdkHelperTaskApp = angular.module('ag.sdk.helper.task', ['ag.sdk.utilities', 'ag.sdk.interface.list']);

sdkHelperTaskApp.provider('taskHelper', function() {
    var _validTaskStatuses = ['assigned', 'in progress', 'in review'];

    var _listServiceMap = function (item) {
        var title = _getTaskTitle(item.todo) + ' for ' + item.organization.name + ' ' + item.id;
        var mappedItems = _.filter(item.subtasks, function (task) {
            return (task.type && _validTaskStatuses.indexOf(task.status) !== -1 && task.type == 'child');
        }).map(function (task) {
                return {
                    id: task.id,
                    title: item.organization.name,
                    subtitle: _getTaskTitle(task.todo),
                    todo: task.todo,
                    groupby: title,
                    status: {
                        text: task.status || ' ',
                        label: _getStatusLabelClass(task.status)
                    }
                }
            });

        return (mappedItems.length ? mappedItems : undefined);
    };

    var _parentListServiceMap = function (item) {
        return {
            id: item.documentId,
            title: item.organization.name,
            subtitle: _getTaskTitle(item.todo),
            status: {
                text: item.status || ' ',
                label: _getStatusLabelClass(item.status)
            }
        };
    };

    var _taskTodoMap = {};

    var _getTaskState = function (taskType) {
        var todo = _taskTodoMap[taskType] || {};

        return todo.state || undefined;
    };

    var _getTaskTitle = function (taskType) {
        var todo = _taskTodoMap[taskType] || {};

        return todo.title || taskType;
    };

    var _getStatusTitle = function (taskStatus) {
        return _taskStatusTitles[taskStatus] || taskStatus || ' ';
    };

    var _getActionTitle = function (taskAction) {
        return _taskActionTitles[taskAction] || taskAction || ' ';
    };

    var _getStatusLabelClass = function (status) {
        switch (status) {
            case 'in progress':
            case 'in review':
                return 'label-warning';
            case 'done':
                return 'label-success';
            default:
                return 'label-default';
        }
    };

    var _taskStatusTitles = {
        'backlog': 'Backlog',
        'assigned': 'Assigned',
        'in progress': 'In Progress',
        'in review': 'In Review',
        'done': 'Done',
        'archive': 'Archived'
    };

    var _taskActionTitles = {
        'accept': 'Accept',
        'decline': 'Decline',
        'assign': 'Assign',
        'start': 'Start',
        'complete': 'Complete',
        'approve': 'Approve',
        'reject': 'Reject',
        'release': 'Release'
    };

    var _taskStatusMap = {
        'rejected': -2,
        'unassigned': -1,
        'pending': 0,
        'assigned': 1,
        'in progress': 2,
        'complete': 3
    };

    /*
     * Provider functions
     */
    this.addTasks = function (tasks) {
        _taskTodoMap =  _.extend(_taskTodoMap, tasks);
    };

    this.$get = ['listService', 'dataMapService', function (listService, dataMapService) {
        return {
            listServiceMap: function() {
                return _listServiceMap;
            },
            parentListServiceMap: function() {
                return _parentListServiceMap;
            },
            getTaskState: _getTaskState,
            getTaskTitle: _getTaskTitle,
            getTaskStatusTitle: _getStatusTitle,
            getTaskActionTitle: _getActionTitle,
            getTaskLabel: _getStatusLabelClass,
            getTaskStatus: function (status) {
                return _taskStatusMap[status];
            },

            updateListService: function (id, todo, tasks, organization) {
                listService.addItems(dataMapService({
                    id: tasks[0].parentTaskId,
                    type: 'parent',
                    todo: todo,
                    organization: organization,
                    subtasks : tasks
                }, _listServiceMap));

                var task = _.findWhere(tasks, {id: id});

                if (task && _validTaskStatuses.indexOf(task.status) === -1) {
                    listService.removeItems(task.id);
                }
            }
        }
    }];
});

sdkHelperTaskApp.factory('taskWorkflowHelper', function() {
    var _taskActions = {
        accept: ['backlog', 'assigned', 'in progress', 'in review', 'complete'],
        decline: ['assigned'],
        start: ['assigned', 'in progress'],
        assign: ['backlog', 'assigned', 'in progress', 'in review'],
        complete: ['assigned', 'in progress'],
        approve: ['in review'],
        reject: ['assigned', 'in review'],
        release: ['done']
    };

    return {
        canChangeToState: function (task, action) {
            return (_taskActions[action] ? _taskActions[action].indexOf(task.status) !== -1 : true);
        }
    }
});

var sdkHelperUserApp = angular.module('ag.sdk.helper.user', []);

sdkHelperUserApp.factory('userHelper', [function() {
    var _listServiceMap = function (item) {
        return {
            title: item.firstName + ' ' + item.lastName,
            subtitle: item.position,
            teams: item.teams
        }
    };

    return {
        listServiceMap: function() {
            return _listServiceMap;
        }
    }
}]);

var sdkInterfaceListApp = angular.module('ag.sdk.interface.list', ['ag.sdk.id']);

sdkInterfaceListApp.factory('listService', ['$rootScope', 'objectId', function ($rootScope, objectId) {
    var _button;
    var _groupby;
    var _infiniteScroll;
    var _search;

    var _items = [];
    var _activeItemId;

    var _defaultButtonClick = function() {
        $rootScope.$broadcast('list::button__clicked');
    };

    var _setButton = function (button) {
        if (_button !== button) {
            if (typeof button === 'object') {
                _button = button;
                _button.click = _button.click || _defaultButtonClick;
            } else {
                _button = undefined;
            }

            $rootScope.$broadcast('list::button__changed', _button);
        }
    };

    var _setGroupby = function (groupby) {
        if (_groupby !== groupby) {
            if (groupby !== undefined) {
                _groupby = groupby;
            } else {
                _groupby = undefined;
            }

            $rootScope.$broadcast('list::groupby__changed', _groupby);
        }
    };

    var _setScroll = function (infinite) {
        if (_infiniteScroll !== infinite) {
            if (infinite !== undefined) {
                _infiniteScroll = infinite;
            } else {
                _infiniteScroll = undefined;
            }

            $rootScope.$broadcast('list::scroll__changed', _infiniteScroll);
        }
    };

    var _setSearch = function (search) {
        if (_search !== search) {
            if (search !== undefined) {
                _search = search;
            } else {
                _search = undefined;
            }

            $rootScope.$broadcast('list::search__changed', _search);
        }
    };

    var _setActiveItem = function(id) {
        _activeItemId = id;

        if (_items instanceof Array) {
            for (var i = 0; i < _items.length; i++) {
                _items[i].active = false;

                if (id !== undefined) {
                    if (_items[i].id == id) {
                        _items[i].active = true;
                    }
                    else if (_items[i].type == id) {
                        _items[i].active = true;
                    }
                }
            }
        } else {
            for (var itemKey in _items) {
                if (_items.hasOwnProperty(itemKey)) {
                    _items[itemKey].active = (itemKey == id);
                }
            }
        }
    };

    var _getActiveItem = function() {
        if (_items instanceof Array) {
            for (var i = 0; i < _items.length; i++) {
                if (_items[i].id == _activeItemId) {
                    return _items[i];
                }
            }
        } else {
            for (var itemKey in _items) {
                if (_items.hasOwnProperty(itemKey) && itemKey == _activeItemId) {
                    return _items[itemKey];
                }
            }
        }

        return null;
    };

    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if(toParams.id) {
            _setActiveItem(toParams.id);
        } else {
            _setActiveItem(toParams.type);
        }
    });

    $rootScope.$on('list::item__selected', function(event, args) {
        if(args.id) {
            _setActiveItem(args.id);
        } else {
            _setActiveItem(args.type);
        }
    });

    return {
        /* CONFIG */
        config: function(config) {
            if (config.reset) {
                _button = undefined;
                _groupby = undefined;
                _infiniteScroll = undefined;
                _search = undefined;

                _items = [];
                _activeItemId = undefined;
            }

            _setButton(config.button);
            _setGroupby(config.groupby);
            _setScroll(config.infiniteScroll);
            _setSearch(config.search);
        },
        button: function(button) {
            if (arguments.length == 1) {
                _setButton(button);
            }
            return _button;
        },
        groupby: function(groupby) {
            if (arguments.length == 1) {
                _setGroupby(groupby);
            }

            return _groupby;
        },
        /**
         *
         * @param {Object} infinite
         * @param {function} infinite.request
         * @param {boolean} infinite.busy
         * @returns {*}
         */
        infiniteScroll: function(infinite) {
            if (arguments.length == 1) {
                _setScroll(infinite);
            }

            return _infiniteScroll;
        },
        search: function(search) {
            if (arguments.length == 1) {
                _setSearch(search);
            }

            return _search;
        },

        /* ITEMS */
        items: function(items) {
            if (items !== undefined) {
                _items = angular.copy(items);
                _activeItemId = undefined;

                $rootScope.$broadcast('list::items__changed', _items);
            }

            return _items;
        },
        length: function () {
            return _items.length;
        },
        addItems: function(items) {
            if (items !== undefined) {
                if ((items instanceof Array) === false) {
                    items = [items];
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    item.id = item.id || objectId().toBase64String();

                    if (_items instanceof Array) {
                        var found = false;

                        for (var x = 0; x < _items.length; x++) {
                            if (item.id == _items[x].id) {
                                _items[x] = item;
                                _items[x].active = (_activeItemId !== undefined && _activeItemId == item.id);
                                found = true;

                                break;
                            }
                        }

                        if (found == false) {
                            _items.push(item);
                        }
                    } else {
                        _items[item.id] = item;
                        _items[item.id].active = (_activeItemId !== undefined && _activeItemId == item.id);
                    }
                }

                $rootScope.$broadcast('list::items__changed', _items);
            }
        },
        removeItems: function(ids) {
            if (ids !== undefined) {
                if ((ids instanceof Array) === false) {
                    ids = [ids];
                }

                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];

                    if (_items instanceof Array) {
                        for (var x = 0; x < _items.length; x++) {
                            if (id == _items[x].id) {
                                _items.splice(x, 1);

                                if (id == _activeItemId) {
                                    var next = (_items[x] ? _items[x] : _items[x - 1]);
                                    $rootScope.$broadcast('list::item__selected', next);
                                }

                                break;
                            }
                        }
                    } else {
                        delete _items[id];
                    }
                }

                $rootScope.$broadcast('list::items__changed', _items);
            }
        },
        selectFirstItem: function() {
            $rootScope.$broadcast('list::selectFirst__requested');
        },
        setActiveItem: function(id) {
            _setActiveItem(id);
        },
        getActiveItem: function() {
            return _getActiveItem();
        }
    }
}]);

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

            return (bounds.length ? [(center[0] / bounds.length), (center[1] / bounds.length)] : null);
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
            if (geometry) {
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
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get('/api/geo/portion-polygon/' + params)
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
            var params = '?x=' + e.latlng.lng + '&y=' + e.latlng.lat;
            $http.get('/api/geo/portion-polygon/' + params)
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


var sdkInterfaceNavigiationApp = angular.module('ag.sdk.interface.navigation', []);

sdkInterfaceNavigiationApp.provider('navigationService', function() {
    var _registeredApps = {};
    var _groupedApps = [];

    var _groupOrder = {
        'Favourites': 1,
        'Assets': 2,
        'Apps': 3,
        'Administration': 4
    };

    var _sortItems = function (a, b) {
        return a.order - b.order;
    };

    var _registerApps = this.registerApps = function(apps) {
        apps = (apps instanceof Array ? apps : [apps]);

        angular.forEach(apps, function (app) {
            app = _.defaults(app, {
                order: 100,
                group: 'Apps'
            });

            if (app.title && app.state) {
                _registeredApps[app.title] = app;
            }
        });
    };

    this.$get = ['$rootScope', '$state', function($rootScope, $state) {
        var _slim = false;
        var _footerText = '';

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            for (var i = 0; i < _groupedApps.length; i++) {
                var group = _groupedApps[i];

                for (var j = 0; j < group.items.length; j++) {
                    group.items[j].active = $state.includes(group.items[j].state);
                }
            }
        });

        $rootScope.$on('navigation::item__selected', function(event, args) {
            console.log(args);
            $state.go(args);
        });

        var _allowApp = function (appName) {
            var app = _registeredApps[appName];

            if (app) {
                var group = _.findWhere(_groupedApps, {title: app.group});

                if (group === undefined) {
                    group = {
                        title: app.group,
                        order: _groupOrder[app.group] || 100,
                        items: []
                    };

                    app.active = $state.includes(app.state);

                    _groupedApps.push(group);
                    _groupedApps = _groupedApps.sort(_sortItems);
                }

                group.items.push(app);
                group.items = group.items.sort(_sortItems);

                $rootScope.$broadcast('navigation::items__changed', _groupedApps);
                $rootScope.$broadcast('navigation::app__allowed', app);
            }
        };

        return {
            getGroupedApps: function () {
                return _groupedApps;
            },
            /*
             * App registration
             */
            registerApps: function (apps) {
                _registerApps(apps);
            },
            unregisterApps: function () {
                _registeredApps = {};
                _groupedApps = [];
            },
            /*
             * Permission control
             */
            allowApp: function (appName) {
                _allowApp(appName);
            },
            revokeAllApps: function () {
                _groupedApps = [];

                $rootScope.$broadcast('navigation::items__changed', _groupedApps);
            },
            /*
             * Control slim toggle
             */
            toggleSlim: function () {
                _slim = !_slim;

                $rootScope.$broadcast('navigation::slim__changed', _slim);
            },
            isSlim: function () {
                return _slim;
            },
            /*
             * Setting navigation sidebar footer
             */
            footerText: function (text) {
                if (text !== undefined) {
                    _footerText = text;

                    $rootScope.$broadcast('navigation::footerText', _footerText);
                }

                return _footerText;
            }
        }
    }];
});

var sdkApp = angular.module('ag.sdk', ['ag.sdk.authorization', 'ag.sdk.id', 'ag.sdk.utilities', 'ag.sdk.api', 'ag.sdk.helper', 'ag.sdk.interface.map']);
