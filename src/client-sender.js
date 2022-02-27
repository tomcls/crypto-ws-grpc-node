
import { createRequire } from "module";
const require = createRequire(import.meta.url);
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

import 'dotenv/config';

import KrakenWS from './krakenws.js';
import BinanceWS from './binancews.js';

let client;

const orderbook = {
  'symbol': 'ALGOBTC',
  'a' : {bids:[],asks:[]} ,
  'b' : {bids:[],asks:[]} 
};

var PROTO_PATH =  './protos/orderbook.proto';
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

const conBinance = new BinanceWS(process.env.BINANCE_WS_ENDPOINT,process.env.BINANCE_PAIR);
const conKraken = new KrakenWS(process.env.KRAKEN_WS_ENDPOINT,process.env.KRAKEN_PAIR);

const main = async() => {
  // Create gRPC client
  client = new proto.Book(
    REMOTE_SERVER,
    grpc.credentials.createInsecure()
  );
  let channelJoin = client.join();
  //When server send a message
  channelJoin.on("data", (orderbook) => {
    if(orderbook && orderbook.exchange === '') {
      console.log('RPC client joined');
    } else {
      //console.log('orderbook',orderbook);
    }
  });
  console.log(new Date, 'Connecting to Binance and Kraken websockets...');
  await conKraken.connect();
  await conBinance.connect();
  console.log(new Date, 'Websocket connected',process.env.KRAKEN_ORDERBOOK_DEPTH);
  const channelKrakenId = await conKraken.subscribe(process.env.KRAKEN_PAIR, process.env.KRAKEN_METHOD, {depth: parseInt(process.env.KRAKEN_ORDERBOOK_DEPTH,10)});
  const channelBinanceId = await conBinance.subscribe(process.env.BINANCE_PAIR, 'SUBSCRIBE', 1, [process.env.BINANCE_PAIR+"@"+process.env.BINANCE_METHOD+process.env.KRAKEN_ORDERBOOK_DEPTH+"@100ms"]);

  console.log(new Date, 'subscribed channelId=',channelKrakenId);
  conKraken.on('channel:' + channelKrakenId, (data) => {
    const keysABids = Object.keys(data.bids);
    const bidsA = [];
    keysABids.forEach((key, index) => {
        bidsA.push({'price':key,'volume':data.bids[key]})
    });
    const keysAAsks = Object.keys(data.asks);
    const asksA = [];
    keysAAsks.forEach((key, index) => {
      asksA.push({'price':key,'volume':data.asks[key]})
    });
    orderbook.a.bids = bidsA;
    orderbook.a.asks = asksA;
  });
  conBinance.on('channel:' + process.env.BINANCE_PAIR+"@"+process.env.BINANCE_METHOD+process.env.KRAKEN_ORDERBOOK_DEPTH+"@100ms", (data) => {
    // FORMAT BINANCE
    const keysBBids = Object.keys(data.bids);
    const bidsB = [];
    keysBBids.forEach((key, index) => {
        bidsB.push({'price':key,'volume':data.bids[key]})
    });
    const keysBAsks = Object.keys(data.asks);
    const asksB = [];
    keysBAsks.forEach((key, index) => {
      asksB.push({'price':key,'volume':data.asks[key]})
    });
    orderbook.b.bids = bidsB;
    orderbook.b.asks = asksB;
  });

  // Inpect orderbook and send it to grpc server
  setInterval(() => {
    if(orderbook.b.bids.length &&
       orderbook.a.bids.length &&
        orderbook.b.asks.length &&
         orderbook.a.asks.length) {
           try {
            client.send(orderbook, (e) => {
              console.log( "[ERROR_CLIENT_SENDER] =>", e);
              process.exit(5);
            });
           } catch (error) {
             console.log( "[ERROR_CLIENT_SENDER] ==>", error);
             process.exit(5); // restart the client via docker run ... --restart always
           }
    }
  }, 300);
   
  // As this script is unstable due to the increase of the memory: the memory increase of 1Mo every ~4 minutes with grpc lib
  // grpc lib: from 6.5 mo to 24 mo and crashes with memory exhausted error
  // @grpc/grpc-js : start from 7 to 70mo (memory increases much faster)
  // and i don't know why and what is increasing the memory size (related to grpc because 
  // it works without interruption when we comment client.send() instruction )
  // lsof -i tcp:50051 -n -P: the number of open conections seems to be stable
  // node --expose_gc 
  // from https://github.com/grpc/grpc-node/issues/686
  setInterval(function() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`Memory usage: ${Math.round(used * 100) / 100} MB`,
     "a.asks.length", orderbook.a.asks.length,
     "b.bids.length", orderbook.b.bids.length,
     "a.asks.length", orderbook.a.asks.length,
     "b.bids.length", orderbook.b.bids.length);
  },2000);
}

main();