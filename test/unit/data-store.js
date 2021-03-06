const body = { name: 'will' };
const mockRequest = {
  method: 'GET',
  url: '/target',
  headers: {
    host: 'localhost:8888',
    connection: 'keep-alive',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko)"' +
      ' Chrome/35.0.1916.153 Safari/537.36',
    'content-type': 'text/plain; charset=utf-8',
    accept: '*/*',
    'accept-encoding': 'gzip,deflate,sdch',
    'accept-language': 'en-US,en;q=0.8',
    cookie: 'm=34e2:; csrftoken=Di8V2cFIUliMJVr0tNb8E4SrwCp5QMdg; sessionid=d2fa382c8a220126c1315c94af4bb42c'
  }
};

const searchRequest = {
  method: 'GET',
  url: mockRequest.url,
  data: body,
  headers: mockRequest.headers
};

const searchResponse = {
  statusCode: '200',
  headers: mockRequest.headers,
  data: body
};

const searchDependencies = [
  {
    method: 'PUT',
    url: mockRequest.url,
    data: body,
    headers: mockRequest.headers
  }
];

const requestEntry = {
  request: searchRequest,
  response: searchResponse,
  expires: 0,
  dependencies: searchDependencies,
  timeout: 0,
  remainingCalls: 1,
  calls: 0
};

export default {
  mockRequest: mockRequest,
  searchRequest: searchRequest,
  searchResponse: searchResponse,
  searchDependencies: searchDependencies,
  requestEntry: requestEntry
};
