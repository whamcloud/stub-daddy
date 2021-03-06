import { describe, beforeEach, it, jasmine, expect, jest } from '../jasmine.js';

const port = 8117;

describe('webservice module', () => {
  let webservice,
    router,
    entries,
    dispatcher,
    mockEntry,
    mockStatus,
    mockLogger,
    mockFs,
    mockRequest,
    mockDispatch,
    mockParseUrl,
    mockAfterTimeout,
    mockConfig;

  beforeEach(() => {
    entries = [];
    mockRequest = {
      createServer: jasmine.createSpy('createServer')
    };

    mockEntry = {
      flushEntries: jasmine.createSpy('flushEntries')
    };

    mockStatus = {
      flushRequests: jasmine.createSpy('flushRequests')
    };
    mockLogger = {
      info: jasmine.createSpy('info'),
      trace: jasmine.createSpy('trace'),
      logByLevel: jasmine.createSpy('logByLevel'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    };
    mockFs = {
      readFileSync: jasmine.createSpy('readFileSync')
    };

    dispatcher = jasmine.createSpy('dispatcher');
    mockDispatch = jasmine.createSpy('dispatch').and.returnValue(dispatcher);

    mockFs.readFileSync.and.callFake(filename => {
      if (filename.indexOf('key.pem') > -1) return 'key-data';
      else if (filename.indexOf('cert.pem') > -1) return 'cert-data';
    });

    mockAfterTimeout = {
      clearTimeouts: jasmine.createSpy('clearTimeouts')
    };

    mockParseUrl = {
      parse: jasmine.createSpy('parse')
    };

    mockConfig = {
      get: jest.fn(() => 'get').mockImplementation(key => {
        switch (key) {
          case 'requestProtocol':
            return 'https';
          case 'port':
            return port;
        }
      })
    };

    router = 'router';

    jest.mock('../logger.js', () => mockLogger);
    jest.mock('../lib/dispatch.js', () => mockDispatch);
    jest.mock('fs', () => mockFs);
    jest.mock('http', () => mockRequest);
    jest.mock('https', () => mockRequest);
    jest.mock('../lib/entry.js', () => mockEntry);
    jest.mock('../middleware/after-timeout.js', () => mockAfterTimeout);
    jest.mock('url', () => mockParseUrl);

    webservice = require('../../web-service').default(
      mockConfig,
      router,
      entries,
      mockStatus
    );
  });

  describe('starting the server', () => {
    let s, server;

    beforeEach(() => {
      server = {
        listen: jasmine.createSpy('listen'),
        once: jasmine.createSpy('once'),
        on: jasmine.createSpy('on'),
        close: jasmine.createSpy('close')
      };

      server.listen.and.returnValue(server);

      mockRequest.createServer.and.returnValue(server);
    });

    describe('in https mode', () => {
      beforeEach(() => {
        s = webservice.startService();
      });

      it('should return the server', () => {
        expect(s).toEqual(server);
      });

      it('should invoke createServer with cert and key files', () => {
        expect(mockRequest.createServer).toHaveBeenCalledOnceWith(
          {
            key: 'key-data',
            cert: 'cert-data'
          },
          jasmine.any(Function)
        );
      });

      it('should listen on the config port', () => {
        expect(server.listen).toHaveBeenCalledOnceWith(port);
      });

      it('should listen for connections', () => {
        expect(server.on).toHaveBeenCalledOnceWith(
          'connection',
          jasmine.any(Function)
        );
      });

      it('should listen for client errors', () => {
        expect(server.on).toHaveBeenCalledOnceWith(
          'clientError',
          jasmine.any(Function)
        );
      });

      it('should log that the service is starting', () => {
        expect(mockLogger.info).toHaveBeenCalledOnceWith(
          `Starting service on https://localhost:${port}`
        );
      });
    });

    describe('in http mode', () => {
      let socket, handleSocketConnection;
      beforeEach(() => {
        mockConfig.get.mockImplementation(key => {
          switch (key) {
            case 'requestProtocol':
              return 'http';
            case 'port':
              return port;
          }
        });

        socket = {
          setTimeout: jasmine.createSpy('setTimeout'),
          once: jasmine.createSpy('once'),
          on: jasmine.createSpy('on'),
          destroy: jasmine.createSpy('destroy')
        };

        s = webservice.startService();

        handleSocketConnection = server.on.calls.argsFor(0)[1];
        handleSocketConnection(socket);
      });

      it('should return the server', () => {
        expect(s).toEqual(server);
      });

      it('should invoke createServer', () => {
        expect(mockRequest.createServer).toHaveBeenCalledOnceWith(
          jasmine.any(Function)
        );
      });

      it('should listen on the config port', () => {
        expect(server.listen).toHaveBeenCalledOnceWith(port);
      });

      it('should listen for connections', () => {
        expect(server.on).toHaveBeenCalledOnceWith(
          'connection',
          jasmine.any(Function)
        );
      });

      it('should listen for client errors', () => {
        expect(server.on).toHaveBeenCalledOnceWith(
          'clientError',
          jasmine.any(Function)
        );
      });

      it('should log that the service is starting', () => {
        expect(mockLogger.info).toHaveBeenCalledOnceWith(
          `Starting service on http://localhost:${port}`
        );
      });

      it('should have a socket count equal to 1', () => {
        expect(webservice.getConnectionCount()).toEqual(1);
      });

      it('should splice off the socket when it is closed', () => {
        const onClose = socket.on.calls.argsFor(0)[1];
        const socketRemoved = onClose();
        expect(socketRemoved).toEqual([socket]);
      });

      describe('handling a request', () => {
        let onRequestReceived, req, res;

        beforeEach(() => {
          onRequestReceived = mockRequest.createServer.calls.argsFor(0)[0];

          req = {
            url: '/api/route',
            method: 'GET'
          };

          res = {
            statusCode: 200
          };

          mockParseUrl.parse.and.returnValue({ path: '/api/route' });
          onRequestReceived(req, res);
        });

        it('should dispatch', () => {
          expect(dispatcher).toHaveBeenCalledOnceWith(
            '/api/route',
            'GET',
            {
              url: '/api/route',
              method: 'GET',
              parsedUrl: { path: '/api/route' }
            },
            {
              statusCode: 200
            }
          );
        });
      });

      describe('stopping the service', () => {
        let done, fail;
        beforeEach(() => {
          done = jasmine.createSpy('done');
          fail = jasmine.createSpy('fail');

          webservice.stopService(fail, done);
        });

        it('should close the server', () => {
          expect(server.close).toHaveBeenCalledOnce();
        });

        it('should log that the service is stopping', () => {
          expect(mockLogger.info).toHaveBeenCalledOnceWith(
            'Service stopping...'
          );
        });

        it('should log that the socket is being destroyed', () => {
          expect(mockLogger.trace).toHaveBeenCalledOnceWith(
            'Destroying 1 remaining socket connections.'
          );
        });

        it('should set the server on the socket', () => {
          expect(socket.server).toEqual(server);
        });

        it('should destroy the socket', () => {
          expect(socket.destroy).toHaveBeenCalledOnce();
        });

        it('should have 0 sockets', () => {
          expect(webservice.getConnectionCount()).toEqual(0);
        });

        it('should flush the entries in the request store', () => {
          expect(mockEntry.flushEntries).toHaveBeenCalledOnce(entries);
        });

        it('should flush the requests in the mockStatus module', () => {
          expect(mockStatus.flushRequests).toHaveBeenCalledOnce();
        });

        it('should clear out all timeouts', () => {
          expect(mockAfterTimeout.clearTimeouts).toHaveBeenCalledOnce();
        });

        describe('on close event', () => {
          let onClose;
          beforeEach(() => {
            onClose = server.once.calls.argsFor(0)[1];
            onClose();
          });

          it('should not fail', () => {
            expect(fail).not.toHaveBeenCalled();
          });

          it('should call done', () => {
            expect(done).toHaveBeenCalledOnce();
          });
        });
      });
    });
  });
});
