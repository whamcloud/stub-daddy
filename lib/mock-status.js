//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import requestMatcher from '../matcher.js';

import logger from '../logger';
import * as fp from '@iml/fp';
import * as obj from '@iml/obj';
import entry from './entry.js';
import picker from './picker.js';
import deepEq from 'deep-equal';

const dataLens = x => x['data'];
const qsLens = x => x['qs'];

const generateErrorMessagesForArray = message => item => ({
  state: 'ERROR',
  message: message,
  data: item
});

export default () => {
  const requests = [];
  const nonMatchingRequests = [];

  const getUnsatisfiedEntries = fp.filter(
    fp.flow(entry.isExpectedCallCount, fp.not)
  );

  return {
    requests,
    recordRequest(request) {
      // Locate the request in the requests dictionary.
      const filterByRequest = requestMatcher(request);
      const locateRequestFilter = fp.filter(
        fp.flow(x => filterByRequest(x.request || x)),
        fp.first
      );
      const locatedRequest = locateRequestFilter(requests);

      // Only add the request if it isn't already in the requests list.
      if (locatedRequest.length === 0) {
        logger.trace(
          {
            request: request
          },
          'recording request to list of requests made'
        );
        requests.push(request);
      }
    },
    recordNonMatchingRequest: [].push.bind(nonMatchingRequests),
    getMockApiState(entries) {
      const unsatisfiedEntries = getUnsatisfiedEntries(entries);
      const state = nonMatchingRequests
        .map(generateErrorMessagesForArray('Call made to non-existent mock'))
        .concat(
          unsatisfiedEntries.map(
            generateErrorMessagesForArray(
              'Call to expected mock not satisfied.'
            )
          )
        );

      logger.trace(
        {
          state: state
        },
        'mock API state'
      );

      if (state.length === 0) logger.trace('mock API state is passing');
      else logger.trace('mock API state contains ' + state.length + ' errors');

      return state;
    },
    getUnsatisfiedEntries,
    haveRequestsBeenSatisfied(entries, requests) {
      if (requests.length === 0) return true;

      function matchRequest(req1, req2) {
        return (
          req1.url === req2.url &&
          req1.method === req2.method &&
          deepEq(dataLens(req1), dataLens(req2)) &&
          deepEq(qsLens(req1), qsLens(req2)) &&
          compareHeaders(req1, req2)
        );
      }

      function matchResponse(resp1, resp2) {
        if (resp2 == null) return true;

        return (
          resp1.statusCode === resp2.statusCode &&
          deepEq(dataLens(resp1), dataLens(resp2)) &&
          compareHeaders(resp1, resp2)
        );
      }

      function compareHeaders(obj1, obj2) {
        const keys = Object.keys(obj1.headers);
        return deepEq(
          obj.pickBy(picker(keys), obj1.headers),
          obj.pickBy(picker(keys), obj2.headers)
        );
      }

      function getMatchingEntries(entries) {
        const requestLens = x => x['request'];
        const responseLens = x => x['response'];
        const invoker = (a, b) => a(b);

        const permutatedRequests = fp.xProd(entries)(requests);
        const requestLensOrIdentity = fp.cond(
          [fp.flow(requestLens, fp.eq(undefined), fp.not), requestLens],
          [fp.True, fp.identity]
        );

        const mappedRequests = fp.map(
          fp.zipBy(invoker)([requestLens, requestLensOrIdentity])
        )(permutatedRequests);

        const mappedResponses = fp.map(
          fp.zipBy(invoker)([responseLens, responseLens])
        )(permutatedRequests);

        const matchingRequests = fp.map(fp.mapFn([matchRequest]))(
          mappedRequests
        );
        const matchingResponses = fp.map(fp.mapFn([matchResponse]))(
          mappedResponses
        );

        const matches = fp.zipBy((...args) => args.every(x => x[0] === true))(
          matchingRequests
        )(matchingResponses);

        let results = fp.zipBy(
          (permutation, match) => (match ? permutation[0] : undefined)
        )(permutatedRequests)(matches);

        results = fp.filter(fp.flow(fp.eq(undefined), fp.not))(results);
        return results;
      }

      const filteredEntries = getMatchingEntries(entries);
      if (filteredEntries.length !== requests.length) return false;

      return fp.every(
        fp.flow(fp.arrayWrap, fp.invoke(entry.isExpectedCallCount))
      )(filteredEntries);
    },
    flushRequests() {
      requests.length = 0;
    }
  };
};
