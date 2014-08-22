var sdkHelperAttachmentApp = angular.module('ag.sdk.helper.attachment', ['ag.sdk.library']);

sdkHelperAttachmentApp.factory('attachmentHelper', ['underscore', function (underscore) {
    var _getResizedAttachment = function (attachments, size) {
        if (attachments !== undefined) {
            if ((attachments instanceof Array) == false) {
                attachments = [attachments];
            }

            return underscore.chain(attachments)
                .filter(function (attachment) {
                    return (attachment.sizes !== undefined && attachment.sizes[size] !== undefined);
                }).map(function (attachment) {
                    return attachment.sizes[size].src;
                }).last().value();
        }

        return attachments;
    };

    return {
        getSize: function (attachments, size) {
            return _getResizedAttachment(attachments, size);
        },
        getThumbnail: function (attachments) {
            return _getResizedAttachment(attachments, 'thumb');
        }
    };
}]);
