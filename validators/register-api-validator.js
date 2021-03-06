//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { Validator } from 'jsonschema';

// request schema
const requestSchema = {
  id: '/RegisterRequest',
  type: 'object',
  required: true,
  properties: {
    method: { type: 'string', required: true },
    url: { type: 'string', required: true },
    data: { type: 'object', required: true },
    headers: { type: 'object', required: true }
  }
};

// response schema
const responseSchema = {
  id: '/RegisterResponse',
  type: 'object',
  required: true,
  properties: {
    statusCode: { type: 'integer', required: true },
    data: { type: 'object', required: true },
    headers: { type: 'object', required: true }
  }
};

// Optional Dependencies
const dependenciesSchema = {
  id: '/RegisterDependencies',
  type: 'array',
  required: true
};

// body schema
const bodySchema = {
  id: '/RegisterApi',
  type: 'object',
  required: true,
  properties: {
    request: { $ref: '/RegisterRequest' },
    response: { $ref: '/RegisterResponse' },
    dependencies: { $ref: '/RegisterDependencies' },
    expires: { type: 'integer', minimum: -1, required: true }
  }
};

export default function validate(body) {
  const v = new Validator();

  // json schema doesn't handle a null body but it will handle undefined. Cast this to
  // undefined in either case.
  if (body == null) body = undefined;

  v.addSchema(requestSchema, '/RegisterRequest');
  v.addSchema(responseSchema, '/RegisterResponse');
  v.addSchema(dependenciesSchema, '/RegisterDependencies');
  return v.validate(body, bodySchema);
}
