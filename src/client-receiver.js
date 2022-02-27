import { createRequire } from "module";
const require = createRequire(import.meta.url);
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
//var readline = require("readline");

import 'dotenv/config';

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
const REMOTE_SERVER = process.env.GRPC_SERVER_URI+":"+process.env.GRPC_SERVER_PORT;

let username;
let client;

function main() {
  // Create gRPC client
  client = new proto.Book(
      REMOTE_SERVER,
      grpc.credentials.createInsecure()
  );
  let channelJoin = client.join({ user: username });
  //When server send a message
  channelJoin.on("data", (orderbook) => {
    if(orderbook && orderbook.exchange==='') {
      console.log('Client joined');
    } else {
      if(orderbook &&
          orderbook.b &&
          orderbook.b.bids.length &&
          orderbook.a.bids.length &&
          orderbook.b.asks.length &&
          orderbook.a.asks.length) {
            const spreadBA = orderbook.b.bids[orderbook.b.bids.length-1].price - orderbook.a.asks[0].price;
            const spreadAB = orderbook.b.bids[orderbook.a.bids.length-1].price - orderbook.b.asks[0].price;
            const used = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(
              'binance/kraken spread %:',Math.abs(spreadBA/orderbook.b.bids[0].price*100).toFixed(2)+'%',
              'kraken/binance spread %:',Math.abs(spreadAB/orderbook.a.bids[0].price*100).toFixed(2)+'%',
              `Memory usage: ${Math.round(used * 100) / 100} MB`);
              // todo: insert into a persitent storage when spread is > 1.8%
              // to have some stats between these to 2 exchange pairs
              // then tests with other pairs in the portfolio
              // then buy on one side and sell on the other side
              // need to test on other exchanges and with other pairs.
      }
    }
  });
}
main();

//Read terminal Lines
/*var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.on("line", function(text) {
  console.log('send orderbook');
  client.send({ 
    exchange: "binance", 
    symbol: 'algobtc',
    bids:{0.00234:500,0.00233:500,0.00232:500,0.00231:500},
    asks:{0.00234:500,0.00233:500,0.00232:500,0.00231:500} 
  }, res => {});
});*/

