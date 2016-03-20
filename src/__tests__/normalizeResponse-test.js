//import fs from 'fs';
import test from 'ava';
import 'babel-register';
import 'babel-polyfill';
import '../normalizeResponse';
import {unionQueryString, unionResponse, unionNormalized} from './_union';
import clientSchema from './clientSchema.json';
import {normalizeResponse} from '../normalizeResponse';
import {parse} from 'graphql/language/parser';
import {buildExecutionContext} from '../buildExecutionContext';
import {nestedQueryString, nestedResponse, nestedNormalized, nestedPaginationWords, nestedVariableValues} from './_nested';
import {front5Response, front5Query, front3Query, front2AfterQuery, front3Response,
  front2AfterResponse, front5Normalized, frontPaginationWords, front5QueryAfter5, front5ResponseAfter5, front9Normalized} from './_front';
import {back5Response, back5Query, back5Normalized,
  backPaginationWords, back3Query, back3Response,
  back3Normalized, back2BeforeQuery, back2BeforeResponse,
  back5QueryAfter5, back5ResponseAfter5, back9Normalized} from './_back';
import {mergeDeepWithArrs} from '../mergeDeep';

export const same = (t, actual, expected, message) => {
  //fs.writeFileSync('avaTests.js', `
  //Actual:
  //  ${JSON.stringify(actual, null, 2).split("\n").join("\n    ")}
  //
  //  Expected:
  //  ${JSON.stringify(expected, null, 2).split("\n").join("\n    ")}
  //
  //`)

  return t.same(actual, expected, `

    ${message}

    Actual:
    ${JSON.stringify(actual, null, 2).split("\n").join("\n    ")}

    Expected:
    ${JSON.stringify(expected, null, 2).split("\n").join("\n    ")}

  `);
};

test('normalizes unions', t => {
  t.plan(1);
  const queryAST = parse(unionQueryString, {noLocation: true, noSource: true});
  const context = buildExecutionContext(clientSchema, queryAST, {idFieldName: '_id'});
  const normalizedResponse = normalizeResponse(unionResponse.data, context);
  t.same(normalizedResponse, unionNormalized);
});

test('normalizes nests with pagination words and variables', t => {
  t.plan(1);
  const queryAST = parse(nestedQueryString, {noLocation: true, noSource: true});
  const nestedOptions = {
    variableValues: nestedVariableValues,
    paginationWords: nestedPaginationWords,
    idFieldName: '_id'
  };
  const context = buildExecutionContext(clientSchema, queryAST, nestedOptions);
  const normalizedResponse = normalizeResponse(nestedResponse, context);
  t.same(normalizedResponse, nestedNormalized);
});

test('normalize front 5', t => {
  t.plan(1);
  const queryAST = parse(front5Query, {noLocation: true, noSource: true});
  const context = buildExecutionContext(clientSchema, queryAST, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse = normalizeResponse(front5Response.data, context);
  t.same(normalizedResponse, front5Normalized);
});

test('normalize back 5 (skip 1)', t => {
  t.plan(1);
  const queryAST = parse(back5Query, {noLocation: true, noSource: true});
  const context = buildExecutionContext(clientSchema, queryAST, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse = normalizeResponse(back5Response.data, context);
  t.same(normalizedResponse, back5Normalized);
});

test('normalize front 3 then additional 2', t => {
  const queryAST3 = parse(front3Query, {noLocation: true, noSource: true});
  const context3 = buildExecutionContext(clientSchema, queryAST3, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse3 = normalizeResponse(front3Response.data, context3);

  const queryAST2 = parse(front2AfterQuery, {noLocation: true, noSource: true});
  const context2 = buildExecutionContext(clientSchema, queryAST2, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse2 = normalizeResponse(front2AfterResponse.data, context2);

  const newState = mergeDeepWithArrs(normalizedResponse3, normalizedResponse2);
  t.same(newState, front5Normalized);
});

test('normalize back 3 (skip 1) then additional 2', t => {
  const queryAST3 = parse(back3Query, {noLocation: true, noSource: true});
  const context3 = buildExecutionContext(clientSchema, queryAST3, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse3 = normalizeResponse(back3Response.data, context3);
  const queryAST2 = parse(back2BeforeQuery, {noLocation: true, noSource: true});
  const context2 = buildExecutionContext(clientSchema, queryAST2, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse2 = normalizeResponse(back2BeforeResponse.data, context2);
  const newState = mergeDeepWithArrs(normalizedResponse3, normalizedResponse2);
  t.same(newState, back5Normalized);
});

test('normalize front 5 request next 5, get 4, set to full', t => {
  const queryAST5 = parse(front5Query, {noLocation: true, noSource: true});
  const context5 = buildExecutionContext(clientSchema, queryAST5, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse5 = normalizeResponse(front5Response.data, context5);
  const queryAST4 = parse(front5QueryAfter5, {noLocation: true, noSource: true});
  const context4 = buildExecutionContext(clientSchema, queryAST4, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse4 = normalizeResponse(front5ResponseAfter5.data, context4);

  const newState = mergeDeepWithArrs(normalizedResponse5, normalizedResponse4);
  t.same(newState, front9Normalized);
});

test('normalize back 5 (skip 1) request next 5, get 3, set to full', t => {
  // only returns 4 results because we don't start at the last because we use count instead of before so it needs a cursor
  // in able to know we're going backwards
  const queryAST5 = parse(back5Query, {noLocation: true, noSource: true});
  const context5 = buildExecutionContext(clientSchema, queryAST5, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse5 = normalizeResponse(back5Response.data, context5);
  const queryAST3 = parse(back5QueryAfter5, {noLocation: true, noSource: true});
  const context3 = buildExecutionContext(clientSchema, queryAST3, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse3 = normalizeResponse(back5ResponseAfter5.data, context3);

  const newState = mergeDeepWithArrs(normalizedResponse5, normalizedResponse3);
  t.same(newState, back9Normalized);
});

test('normalize front 5 request back 5 skip 1, set to full', t => {
  const queryAST5 = parse(front5Query, {noLocation: true, noSource: true});
  const context5 = buildExecutionContext(clientSchema, queryAST5, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse5 = normalizeResponse(front5Response.data, context5);
  const queryAST5back = parse(back5Query, {noLocation: true, noSource: true});
  const context5Back = buildExecutionContext(clientSchema, queryAST5back, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse5Back = normalizeResponse(back5Response.data, context5Back);

  const newState = mergeDeepWithArrs(normalizedResponse5, normalizedResponse5Back);
  t.same(newState, back9Normalized);
});

test('normalize back 5 (skip 1), request front 5, set to full', t => {
  const queryAST5 = parse(back5Query, {noLocation: true, noSource: true});
  const context5 = buildExecutionContext(clientSchema, queryAST5, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse5 = normalizeResponse(back5Response.data, context5);
  const queryAST5front = parse(front5Query, {noLocation: true, noSource: true});
  const context5Front = buildExecutionContext(clientSchema, queryAST5front, {idFieldName: '_id', paginationWords: frontPaginationWords});
  const normalizedResponse5Front = normalizeResponse(front5Response.data, context5Front);

  const newState = mergeDeepWithArrs(normalizedResponse5, normalizedResponse5Front);
  t.same(newState, back9Normalized);
});
