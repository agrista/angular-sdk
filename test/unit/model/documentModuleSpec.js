describe('ag.sdk.model.document', function () {
    var Mocks, Model, Document;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.document'));
    beforeEach(inject(['Document', 'Model', 'mocks', function(_Document_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        Document = _Document_;
    }]));

    describe('initialization', function () {
        var document;

        beforeEach(function () {
            document = Document.new({
                author: 'Agrista',
                docType: 'asset register',
                organizationId: 1
            });
        });

        it('adds docTypes to the class', function () {
            expect(Document.docTypes).toBeDefined(true);
        });

        it('validates the author length', function () {
            expect(document.validate()).toBe(true);

            document.author = '';
            expect(document.validate()).toBe(false);

            document.author = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(document.validate()).toBe(false);
        });

        it('validates the docType', function () {
            expect(document.validate()).toBe(true);
            document.docType = 'not a docType';
            expect(document.validate()).toBe(false);
        });

        it('validates the organizationId', function () {
            expect(document.validate()).toBe(true);

            document.organizationId = 'Not a number';
            expect(document.validate()).toBe(false);

            document.organizationId = undefined;
            expect(document.validate()).toBe(false);
        });
    });
});
