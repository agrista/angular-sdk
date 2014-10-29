/**
 * @module test.ag.sdk.api
 * @name userApi
 * @description
 * Testing the userApi service
 */

describe('Service: ag.sdk.api.userApi', function () {

    // load the service's module
    beforeEach(module('ag.sdk.api'));

    // instantiate service
    var service;

    //update the injection
    beforeEach(inject(function (userApi) {
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
