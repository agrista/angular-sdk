var sdkApiApp = angular.module('ag.sdk.core.api', ['ag.sdk.core.utilities']);

/**
 * User API
 */
sdkApiApp.factory('userApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getUsers: function (page) {
            return pagingService.page('/api/users', page);
        },
        getUsersByRole: function (id, role) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/users/farmer/' + id + '?rolename=' + role, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createUser: function (userData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/user', userData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getUser: function (id, username) {
            if(username) {
                var param = '?username=' + username;
            }
            return promiseService.wrap(function(promise) {
                $http.get('/api/user/' + id + (param? param : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateUser: function (userData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/user/' + userData.id, userData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteUser: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/user/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Role API
 */
sdkApiApp.factory('roleApi', ['$http', 'promiseService', function($http, promiseService) {
    return {
        //todo: handle different report types
        getRoles: function () {
            return promiseService.wrap(function(promise) {
                $http.get('/api/roles', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateRoleApps: function (roleList) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/role-apps', roleList, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Team API
 */
sdkApiApp.factory('teamApi', ['$http', 'promiseService', function($http, promiseService) {
    return {
        getTeams: function () {
            return promiseService.wrap(function(promise) {
                $http.get('/api/teams', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createTeam: function(teamData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/team', teamData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeam: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/team/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTeamUsers: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/team/' + id + '/users', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTeam: function (teamData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/team/' + teamData.id, teamData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTeam: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/team/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Notification API
 */
sdkApiApp.factory('notificationApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getNotifications: function (page) {
            return pagingService.page('/api/notifications', page);
        },
        getNotification: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/notification/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        rejectNotification: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/notification/' + id + '/reject', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteNotification: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/notification/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Task API
 */
sdkApiApp.factory('taskApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getTasks: function (page) {
            return pagingService.page('/api/tasks', page);
        },
        createTask: function(taskData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/task', taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getTask: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/task/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendTask: function (id, requestData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/task/' + id + '/send', requestData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTask: function (taskData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/task/' + taskData.id, taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTaskStatus: function (taskData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/task/' + taskData.id + '/status', taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateTaskAssignment: function (taskData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/task/' + taskData.id, taskData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteTask: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/task/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Merchant API
 */
sdkApiApp.factory('merchantApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getMerchants: function(page) {
            return pagingService.page('/api/merchants', page);
        },
        searchMerchants: function(query) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/merchants?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchByService: function(query, point) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/merchants/services?search=' + query + (point ? '&x=' + point[0] + '&y=' + point[1] : ''), {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createMerchant: function(merchantData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/merchant', merchantData, {withCredentials: true}).then(function(res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteMerchant: function(id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/merchant/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchant: function(id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/merchant/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getMerchantActivities: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/merchant/' + id + '/activities', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateMerchant: function(merchantData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/merchant/' + merchantData.id, merchantData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteMerchant: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/merchant/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Service API
 */
sdkApiApp.factory('serviceApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getServices: function(page) {
            return pagingService.page('/api/services', page);
        },
        getServiceTypes: function() {
            return promiseService.wrap(function(promise) {
                $http.get('/api/service/types', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getService: function(id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/service/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farmer API
 */
sdkApiApp.factory('farmerApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getFarmers: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page('/api/farmers' + (id ? '/' + id : ''),  page);
        },
        searchFarmers: function(query) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/farmers?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createFarmer: function(farmData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/farmer', farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        inviteFarmer: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/farmer/' + id + '/invite', {}, {withCredentials: true}).then(function (res) {

                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarmer: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/farmer/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarmer: function (farmData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/farmer/' + farmData.id, farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarmer: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/farmer/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Legal Entity API
 */
sdkApiApp.factory('legalEntityApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getEntities: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page('/api/legalentities' + (id ? '/' + id : ''),  page);
        },
        updateEntity: function (data) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/legalentity/' + data.id, data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getEntity: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/legalentity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        createEntity: function(data) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/legalentity', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteEntity: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/legalentity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Farm API
 */
sdkApiApp.factory('farmApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getFarms: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page('/api/farms' + (id ? '/' + id : ''),  page);
        },
        createFarm: function(farmData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/farm', farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getFarm: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/farm/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateFarm: function (farmData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/farm/' + farmData.id, farmData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteFarm: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/farm/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Asset API
 */
sdkApiApp.factory('assetApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getAssets: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page('/api/assets' + (id ? '/' + id : ''),  page);
        },
        createAsset: function(assetData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/asset', assetData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getAsset: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/asset/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateAsset: function (assetData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/asset/' + assetData.id, assetData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteAsset: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/asset/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadAssetAttachments: function(id, data) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/asset/' + id +'/attach', data, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            })
        }
    };
}]);

/**
 * Document API
 */
sdkApiApp.factory('documentApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getDocuments: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page('/api/documents' + (id ? '/' + id : ''),  page);
        },
        createDocument: function(documentData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/document', documentData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getDocument: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/document/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        sendDocument: function (id, requestData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/document/' + id + '/send', requestData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        updateDocument: function (documentData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/document/' + documentData.id, documentData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteDocument: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/document/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        uploadDocumentAttachments: function(id, data) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/document/' + id +'/attach', data, {withCredentials: true}).then(function (res) {
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
                $http.post('/api/document/pdf', data, options)
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
sdkApiApp.factory('activityApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getActivities: function (id, page) {
            if (typeof id === 'object') {
                page = id;
                id = undefined;
            }

            return pagingService.page('/api/activities' + (id ? '/' + id : ''),  page);
        },
        createActivity: function(activityData) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/activity', activityData, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        getActivity: function (id) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/activity/' + id, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        deleteActivity: function (id) {
            return promiseService.wrap(function(promise) {
                $http.post('/api/activity/' + id + '/delete', {}, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Agrista API
 */
sdkApiApp.factory('agristaApi', ['$http', 'pagingService', 'promiseService', function($http, pagingService, promiseService) {
    return {
        getMerchants: function() {
            return promiseService.wrap(function(promise) {
                $http.get('/api/agrista/providers', {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        },
        searchMerchants : function(query) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/agrista/providers?search=' + query, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);

/**
 * Attachment API
 */
sdkApiApp.factory('attachmentApi', ['$http', 'promiseService', function($http, promiseService) {
    return {
        getAttachmentUri: function(key) {
            return promiseService.wrap(function(promise) {
                $http.get('/api/attachment/' + key, {withCredentials: true}).then(function (res) {
                    promise.resolve(res.data);
                }, promise.reject);
            });
        }
    };
}]);
