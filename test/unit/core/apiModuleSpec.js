/**
 * @module test.ag.sdk.api
 * @name userApi
 * @description
 * Testing the userApi service
 */

describe('Service: ag.sdk.api.userApi', function () {
    var service;
    beforeEach(module('ag.sdk.api'));
    beforeEach(inject(function(userApi) {
        service = userApi;
    }));

    /**
     * @description
     * Sample test case to check if the service is injected properly
     */
    it('should be injected and defined', function () {
        expect(service).toBeDefined();
    });
});
