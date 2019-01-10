var sdkModelTask = angular.module('ag.sdk.model.task', ['ag.sdk.library', 'ag.sdk.model.base']);

sdkModelTask.factory('Task', ['Base', 'inheritModel', 'Model', 'underscore',
    function (Base, inheritModel, Model, underscore) {
        function Task (attrs) {
            Model.Base.apply(this, arguments);

            this.data = (attrs && attrs.data ? attrs.data : {});

            if (underscore.isUndefined(attrs) || arguments.length === 0) return;

            this.id = attrs.id || attrs.$id;
            this.assignedAt = attrs.assignedAt;
            this.assignedBy = attrs.assignedBy;
            this.assignedTo = attrs.assignedTo;
            this.completedAt = attrs.completedAt;
            this.createdAt = attrs.createdAt;
            this.createdBy = attrs.createdBy;
            this.data = attrs.data;
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

            // Models
            this.document = attrs.document;
            this.organization = attrs.organization;
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
