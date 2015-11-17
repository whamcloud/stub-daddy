'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('validate mock', function () {
  var registerApiValidator, validateMock, req, res, body, next;
  beforeEach(function () {
    registerApiValidator = jasmine.createSpy('registerApiValidator');

    req = {};
    res = {};
    body = {foo: 'bar'};
    next = jasmine.createSpy('next');

    validateMock = proxyquire('../../../middleware/validate-mock', {
      '../validators/register-api-validator': registerApiValidator
    });
  });

  it('should call next with the body if validation passes', function () {
    registerApiValidator.and.returnValue({
      errors: []
    });

    validateMock(req, res, body, next);

    expect(next).toHaveBeenCalledOnceWith(req, res, body);
  });

  it('should call next with null as the body if validation does not pass', function () {
    registerApiValidator.and.returnValue({
      errors: ['error']
    });

    validateMock(req, res, body, next);

    expect(next).toHaveBeenCalledOnceWith(req, res, null);
  });
});