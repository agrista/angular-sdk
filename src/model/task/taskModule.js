var sdkModelTask = angular.module('ag.sdk.model.task', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelTask.factory('Task', ['Base', 'inheritModel', 'Model', 'underscore',
    function (Base, inheritModel, Model, underscore) {
        function Task (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assignedAt = attrs.assignedAt;
            this.assignerUserId = attrs.assignerUserId;
            this.completedAt = attrs.completedAt;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.documentId = attrs.documentId;
            this.documentKey = attrs.documentKey;
            this.organizationId = attrs.organizationId;
            this.originUuid = attrs.originUuid;
            this.parentTaskId = attrs.parentTaskId;
            this.progressAt = attrs.progressAt;
            this.providerType = attrs.providerType;
            this.providerUuid = attrs.providerUuid;
            this.status = attrs.status;
            this.todo = attrs.todo;
            this.type = attrs.type;
            this.updatedAt = attrs.updatedAt;
            this.updatedBy = attrs.updatedBy;
            this.userId = attrs.userId;

            // Models
            this.assignerUser = attrs.assignerUser;
            this.document = attrs.document;
            this.organization = attrs.organization;
            this.user = attrs.user;
        }

        inheritModel(Task, Model.Base);

        Task.validates({
            documentId: {
                required: true,
                numeric: true
            },
            organizationId: {
                required: true,
                numeric: true
            },
            originUuid: {
                requiredIf: function (value, instance, field) {
                    return instance.type === 'external';
                },
                format: {
                    uuid: true
                }
            },
            parentTaskId: {
                requiredIf: function (value, instance, field) {
                    return instance.type !== 'parent';
                },
                numeric: true
            },
            providerType: {
                requiredIf: function (value, instance, field) {
                    return instance.type === 'external';
                },
                length: {
                    min: 1,
                    max: 255
                }
            },
            providerUuid: {
                requiredIf: function (value, instance, field) {
                    return instance.type === 'external';
                },
                format: {
                    uuid: true
                }
            },
            uuid: {
                format: {
                    uuid: true
                }
            }
        });

        return Task;
    }]);

sdkModelTask.provider('TaskFactory', function () {
    var instances = {};

    this.add = function (todo, modelName) {
        instances[todo] = modelName;
    };

    this.$get = ['$injector', 'Task', function ($injector, Task) {
        function apply (attrs, fnName) {
            if (instances[attrs.todo]) {
                if (typeof instances[attrs.todo] === 'string') {
                    instances[attrs.todo] = $injector.get(instances[attrs.todo]);
                }

                return instances[attrs.todo][fnName](attrs);
            }

            return Task[fnName](attrs);
        }

        return {
            isInstanceOf: function (task) {
                return (task ?
                    (instances[task.todo] ?
                        task instanceof instances[task.todo] :
                        task instanceof Task) :
                    false);
            },
            new: function (attrs) {
                return apply(attrs, 'new');
            },
            newCopy: function (attrs) {
                return apply(attrs, 'newCopy');
            }
        }
    }];
});
