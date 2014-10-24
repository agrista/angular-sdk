var sdkHelperAttachmentApp = angular.module('ag.sdk.helper.attachment', ['ag.sdk.library']);

sdkHelperAttachmentApp.provider('attachmentHelper', ['underscore', function (underscore) {
    var _options = {
        defaultImage: 'img/camera.png'
    };

    this.config = function (options) {
        _options = underscore.defaults(options || {}, _options);
    };

    this.$get = function () {
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
            getSize: function (attachments, size, defaultImage) {
                return _getResizedAttachment(attachments, size) || defaultImage || _options.defaultImage;
            },
            getThumbnail: function (attachments, defaultImage) {
                return _getResizedAttachment(attachments, 'thumb') || defaultImage || _options.defaultImage;
            }
        };
    };
}]);
