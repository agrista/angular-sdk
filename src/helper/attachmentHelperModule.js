var sdkHelperAttachmentApp = angular.module('ag.sdk.helper.attachment', ['ag.sdk.library']);

sdkHelperAttachmentApp.provider('attachmentHelper', ['underscore', function (underscore) {
    var _options = {
        defaultImage: 'img/camera.png',
        fileResolver: function (uri) {
            return uri;
        }
    };

    this.config = function (options) {
        _options = underscore.defaults(options || {}, _options);
    };

    this.$get = ['$injector', 'promiseService', function ($injector, promiseService) {
        if (_options.fileResolver instanceof Array) {
            _options.fileResolver = $injector.invoke(_options.fileResolver);
        }

        var _getResizedAttachment = function (attachments, size, defaultImage) {
            if ((attachments instanceof Array) == false) {
                attachments = [attachments];
            }

            defaultImage = defaultImage || _options.defaultImage;

            var src = underscore.chain(attachments)
                .filter(function (attachment) {
                    return (attachment.sizes && attachment.sizes[size]);
                }).map(function (attachment) {
                    return attachment.sizes[size].src;
                }).last().value();

            return (src ? _options.fileResolver(src) : defaultImage);
        };

        return {
            findSize: function (obj, size, defaultImage) {
                return _getResizedAttachment((obj.data && obj.data.attachments ? obj.data.attachments : []), size, defaultImage);
            },
            getSize: function (attachments, size, defaultImage) {
                return _getResizedAttachment((attachments ? attachments : []), size, defaultImage);
            },
            getThumbnail: function (attachments, defaultImage) {
                return _getResizedAttachment((attachments ? attachments : []), 'thumb', defaultImage);
            },
            resolveUri: function (uri) {
                return _options.fileResolver(uri);
            }
        };
    }];
}]);

sdkHelperAttachmentApp.factory('resizeImageService', ['promiseService', 'underscore', function (promiseService, underscore) {
    return function (imageOrUri, options) {
        var _processImage = function (image) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            options = underscore.defaults(options || {}, {
                width: 80,
                height: 80,
                center: true,
                crop: true,
                output: 'image/png'
            });

            canvas.width = options.width;
            canvas.height = options.height;

            if (options.crop) {
                var sX = 0, sY = 0;
                var scaleToHeight = (((options.width * image.height) / options.height) > image.width);

                var sW = (scaleToHeight ? Math.floor(image.width) : Math.floor((options.width * image.height) / options.height));
                var sH = (scaleToHeight ? Math.floor((options.height * image.width) / options.width) : Math.floor(image.height));

                if (options.center) {
                    sX = (scaleToHeight ? 0 : Math.floor((sW - options.width) / 2));
                    sY = (scaleToHeight ? Math.floor((sH - options.height) / 2) : 0);
                }

                ctx.drawImage(image, sX, sY, sW, sH, 0, 0, options.width, options.height);
            } else {
                ctx.drawImage(image, 0, 0, options.width, options.height);
            }

            return canvas.toDataURL(options.output, 1);
        };

        return promiseService.wrap(function (promise) {
            if (typeof imageOrUri == 'string') {
                var image = new Image();

                image.onload = function () {
                    promise.resolve(_processImage(image));
                };

                image.src = imageOrUri;
            } else {
                promise.resolve(_processImage(imageOrUri));
            }
        });
    };
}]);