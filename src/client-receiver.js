import 'dotenv/config';
import grpc  from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import fs from 'fs';

const host = process.env.host ? process.env.host: 'localhost';
const with_ssl = process.env.with_ssl && process.env.with_ssl != 0 && process.env.with_ssl != 'no' && process.env.with_ssl != 'false' ? true: false;
const REMOTE_SERVER = (host === '0.0.0.0' ? 'localhost' : host )+ ":"+process.env.GRPC_SERVER_PORT;

var PROTO_PATH = './protos/orderbook.proto';
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {keepCase: true,
   longs: String,
   enums: String,
   defaults: true,
   oneofs: true
  });
  
var proto = grpc.loadPackageDefinition(packageDefinition).crypto;

let client;

function main() {

  let  credentials;
  if (with_ssl) {
    credentials = grpc.credentials.createSsl(
      fs.readFileSync('./srv/cert/ca.crt'), 
      fs.readFileSync('./srv/cert/client.key'), 
      fs.readFileSync('./srv/cert/client.crt')
    );
  }
  // Create gRPC client
  client = new proto.Book(
      REMOTE_SERVER,
      with_ssl ? credentials:  grpc.credentials.createInsecure()
  );
  console.log(new Date, '[GRPC_RECEIVER] ========> Client started and the connexion is ',with_ssl ? 'secure': 'unsecure' );

  let channelJoin = client.receive({ name: 'alogbtc' },(e,b)=>{console.log('receiver.callback',e,b)});
  // When server send a message
  channelJoin.on('data', (orderbook) => {
      if(orderbook &&
          orderbook.binance &&
          orderbook.binance.bids.length &&
          orderbook.kraken.bids.length &&
          orderbook.binance.asks.length &&
          orderbook.kraken.asks.length) {

            const spreadBA = orderbook.binance.bids[0].price - orderbook.kraken.asks[0].price;
            const spreadAB = orderbook.kraken.bids[0].price - orderbook.binance.asks[0].price;
            const used = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(
              'binance/kraken spread %:',Math.abs(spreadBA/orderbook.binance.bids[0].price*100).toFixed(2)+'%',
              'kraken/binance spread %:',Math.abs(spreadAB/orderbook.kraken.bids[0].price*100).toFixed(2)+'%',
              `Memory usage: ${Math.round(used * 100) / 100} MB`);
              // todo: insert into a persitent storage when spread is > 1.8%
              // to have some stats between these to 2 exchange pairs
              // then test with other pairs in the portfolio
              // then buy on one side and sell on the other side
              // need to test on other exchanges and with other pairs.
      }
  });
}
main();

