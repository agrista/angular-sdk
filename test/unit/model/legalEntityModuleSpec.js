describe('ag.sdk.model.legal-entity', function () {
    var Mocks, Model, LegalEntity;
    beforeEach(module('ag.sdk.model.base'));
    beforeEach(module('ag.test.model.mocks'));
    beforeEach(module('ag.sdk.model.legal-entity'));
    beforeEach(inject(['LegalEntity', 'Model', 'mocks', function(_LegalEntity_, _Model_, _mocks_) {
        Model = _Model_;
        Mocks = _mocks_;
        LegalEntity = _LegalEntity_;
    }]));

    describe('initialization', function () {
        var legalEntity;

        beforeEach(function () {
            legalEntity = LegalEntity.new({
                email: 'dave@email.com',
                name: 'Dave',
                organizationId: 1,
                registrationNumber: 'DD3432443',
                type: 'Individual'
            });
        });

        it('validates the name length', function () {
            expect(legalEntity.validate()).toBe(true);

            legalEntity.name = '';
            expect(legalEntity.validate()).toBe(false);

            legalEntity.name = 'Lorem ipsum dolor sit amet, consectetur adiepiscing elit. Vivamus sit amet sollicitudin tellus. Nulla facilisi. Vestibulum erat urna, euismod at posuere ullamcorper, ultrices in lacus. Aenean molestie odio ac vestibulum molestie. Quisque id fringilla amet.';
            expect(legalEntity.validate()).toBe(false);
        });

        it('validates the email', function () {
            expect(legalEntity.validate()).toBe(true);

            legalEntity.email = 'not a email';
            expect(legalEntity.validate()).toBe(false);

            legalEntity.email = 'dave@email';
            expect(legalEntity.validate()).toBe(false);
        });

        it('validates the type', function () {
            expect(legalEntity.validate()).toBe(true);

            legalEntity.type = 'not a type';
            expect(legalEntity.validate()).toBe(false);
        });

        it('validates the telephone', function () {
            expect(legalEntity.validate()).toBe(true);

            legalEntity.telephone = '089 3848383';
            expect(legalEntity.validate()).toBe(true);

            legalEntity.telephone = '+49 89 3848383';
            expect(legalEntity.validate()).toBe(true);

            legalEntity.telephone = '+49 (0)89 3848383';
            expect(legalEntity.validate()).toBe(true);

            legalEntity.telephone = '+49 (0)89 3848383 [989]';
            expect(legalEntity.validate()).toBe(false);

            legalEntity.telephone = 'not a telephone';
            expect(legalEntity.validate()).toBe(false);
        });

        it('validates the organizationId', function () {
            expect(legalEntity.validate()).toBe(true);

            legalEntity.organizationId = 'Not a number';
            expect(legalEntity.validate()).toBe(false);

            legalEntity.organizationId = undefined;
            expect(legalEntity.validate()).toBe(false);
        });

        it('validates a full entity', function () {
            legalEntity = LegalEntity.new({
                __complete: true,
                __dirty: false,
                __id: 8593,
                __local: false,
                __saved: true,
                __uri: "legalentities/8605",
                contactName: "Dave Steen",
                createdAt: "2015-01-16T09:53:23.520+0000",
                createdBy: "rsavage",
                email: "dave.steen@mailinator.com",
                id: 8593,
                isActive: true,
                isPrimary: true,
                name: "Dave Steen",
                organizationId: 8605,
                type: "Individual",
                uuid: "952ba751-af48-4dbd-a373-67d99d8c3716"
            });

            expect(legalEntity.validate()).toBe(true);

            console.log(legalEntity.$errors)
        })
    });
});
