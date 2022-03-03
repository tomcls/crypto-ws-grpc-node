import 'dotenv/config';
import grpc  from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import fs from 'fs';

const host = process.env.host ? process.env.host: 'localhost';
const with_ssl = process.env.with_ssl && process.env.with_ssl != 0 && process.env.with_ssl != 'no' && process.env.with_ssl != 'false' ? true: false;

const SERVER_ADDRESS = (host === 'localhost' ? '0.0.0.0' : host )+ ":"+ process.env.GRPC_SERVER_PORT;
const PROTO_PATH =  './protos/orderbook.proto';

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
const proto = grpc.loadPackageDefinition(packageDefinition);

const clients = [];

const orderbook = {
  'symbol': null,
  'kraken': {bids:[],asks:[]} ,
  'binance': {bids:[],asks:[]} 
};
/**
 * StreamOrderBook handler. Gets a stream of an exchange orderbook, 
 * and responds when two distinct exchanges
 * have been well received
 * Finally, on end event, broadcast the order combined orderbook to client receiver
 * @param {Readable} call The request orderbook stream.
 * @param {function(Error, orderBookStatus)} callback The callback to pass the
 *     response to
 */
 function recordOrderBook(call, callback) {

    call.on('data', function(exchangeBook) {

      orderbook.symbol = exchangeBook.symbol;
      orderbook[exchangeBook.exchange].bids = exchangeBook.bids;
      orderbook[exchangeBook.exchange].asks = exchangeBook.asks;

    });

    call.on('end', function() {

      const used = process.memoryUsage().heapUsed / 1024 / 1024;

      clients.forEach(client => {
        console.log(new Date, '[GRPC_SERVER] ========> Broadcast orderbook MEMORY_USAGE=',`Memory usage: ${Math.round(used * 100) / 100} MB`);
        client.write(orderbook);
      });
      
      callback(null, {
        status: "OK" 
      });
    });
}
/**
 * Receive request handler. Gets a request with symbol (e.g: algobtc), 
 * and store the client that request this symbol (logic to be written... we could add the 2 exhanges so { name: 'alogbtc' , exhanges: 'binance-kraken'} )
 * @param {Writable} call Writable stream for responses with an additional
 *     request property for the request value.
 */
function receive(call) {

  console.log(new Date, '[GRPC_SERVER] ========> Server is receiving data', call.request);
  clients.push(call);
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
 function main() {

  let credentials;
  if(with_ssl) {
    credentials = grpc.ServerCredentials.createSsl(
      fs.readFileSync('./srv/cert/ca.crt'), [{
      cert_chain: fs.readFileSync('./srv/cert/server.crt'),
      private_key: fs.readFileSync('./srv/cert/server.key')
    }], true);
  }

  var server = new grpc.Server();

  server.addService(
    proto.crypto.Book.service, 
    {
      receive: receive, 
      recordOrderBook: recordOrderBook
    }), (a,b) => {
      console.log("============>", a, b)
    };

  server.bindAsync(SERVER_ADDRESS, with_ssl ? credentials:  grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.log(new Date, '[GRPC_SERVER] ========> error binding grpc server', err);
    }
    server.start();
    console.log(new Date, '[GRPC_SERVER] ========> Server started and the connexion is ',with_ssl ? 'secure': 'unsecure' );
  });
}

main();