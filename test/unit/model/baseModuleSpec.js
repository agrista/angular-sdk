describe('ag.sdk.model.base', function () {
    var Mocks, Model, Document, inheritModel;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(inject(['Model', 'mocks', 'inheritModel', function(_Model_, _mocks_, _inheritModel_) {
        Model = _Model_;
        Mocks = _mocks_;
        inheritModel = _inheritModel_;
        Document = Mocks.Document;
    }]));

    describe('inherit', function () {
        beforeEach(function () {
            inheritModel(Document, SomeBaseClass);

            function SomeBaseClass(attributes) {
                var _constructor = this;
                var _prototype = _constructor.prototype;

                _constructor.new = function(attributes) {
                    var instance = new _constructor(attributes);
                    return instance;
                };

                _prototype.$save = angular.noop;
            }
        });

        it('adds methods to the child class', function() {
            expect(Document.new).toBeDefined();
            expect(Document.extend).toBeDefined();

        });

        it('adds methods to the instances', function() {
            var document = Document.new({});
            expect(document.$save).toBeDefined();
        });
    });

    describe('extend', function () {
        var document;

        beforeEach(function () {
            Document.extend(Postable);
            Document.include(Postable);

            function Postable () {
                this.posted = true;
                this.post = function () {};

                Object.defineProperty(this, 'poster', {
                    get: function () {
                        return 'me';
                    }
                });

                this.__posted = true;
                this.__post = function () {};

                Object.defineProperty(this, '__poster', {
                    get: function () {
                        return 'me';
                    }
                })
            }

            document = Document.new({});
        });

        it('adds properties from the mixin to the class', function () {
            expect(Document.posted).toBe(true);
        });

        it('adds functions from the mixin to the class', function () {
            expect(Document.post).toBeDefined();
        });

        it('adds defined properties from the mixin to the class', function () {
            expect(Document.poster).toEqual('me');
        });

        it('adds properties from the mixin to instances', function () {
            expect(document.posted).toBe(true);
        });

        it('adds functions from the mixin to instances', function () {
            expect(document.post).toBeDefined();
        });

        it('adds defined properties from the mixin to instances', function () {
            expect(document.poster).toEqual('me');
        });
    })


});
