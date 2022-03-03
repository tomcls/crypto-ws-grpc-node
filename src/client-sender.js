import 'dotenv/config';
import grpc  from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import fs from 'fs';

import KrakenWS from './service/krakenws.js';
import BinanceWS from './service/binancews.js';

const host = process.env.host ? process.env.host: 'localhost';
const with_ssl = process.env.with_ssl && process.env.with_ssl != 0 && process.env.with_ssl != 'no' && process.env.with_ssl != 'false' ? true: false;
const REMOTE_SERVER = (host === '0.0.0.0' ? 'localhost' : host )+ ":"+process.env.GRPC_SERVER_PORT;

console.log('REMOTE_SERVER',REMOTE_SERVER)

let client;
let gRPCCall;

const orderbook = {
  'symbol': 'ALGOBTC',
  'kraken': {bids:[],asks:[]} ,
  'binance': {bids:[],asks:[]} 
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

console.log("host",host, REMOTE_SERVER)

const  handleMessage = (data) => {

  if(!gRPCCall) return;

  const exchangeBook = {
    symbol: data.symbol,
    exchange: data.exchange,
    bids: [],
    asks: []
  }

  const keysBids = Object.keys(data.bids);
  const bids = [];
  keysBids.forEach((key, index) => {
      bids.push({'price':parseFloat(key),'volume':parseFloat(data.bids[key])})
  });

  const keysAsks = Object.keys(data.asks);
  const asks = [];
  keysAsks.forEach((key, index) => {
      asks.push({'price':parseFloat(key),'volume':parseFloat(data.asks[key])})
  });

  exchangeBook.bids = bids;
  exchangeBook.asks = asks;

  orderbook[exchangeBook.exchange].bids = exchangeBook.bids;
  orderbook[exchangeBook.exchange].asks = exchangeBook.asks;

  try {
    gRPCCall.write(exchangeBook);
  } catch(e) {
    console.log(new Date, '[CLIENT_SENDER] ========> ERROR FROM GRPC SERVER', e);
  }
  
  if(orderbook.binance.bids.length > 0  && orderbook.kraken.bids.length > 0 ) {
    orderbook.binance.bids = [];
    orderbook.binance.asks = [];
    orderbook.kraken.bids = [];
    orderbook.kraken.asks = [];
    orderbook.symbol = null;
    gRPCCall.end();
    streamOrderBook();
  }
}
const  streamOrderBook = () => {
  gRPCCall = client.recordOrderBook(function(error, stats) {
    if (error) {
      console.log(new Date, '[CLIENT_SENDER] ========> ERROR GRPC ', error);
      return;
    }
    console.log(new Date, '[CLIENT_SENDER] END_STREAM STATUS=', stats.status);
  });
}

const conBinance = new BinanceWS (
    process.env.BINANCE_WS_ENDPOINT,
    process.env.BINANCE_PAIR,
    10,
    'depth',
    handleMessage
  );
const conKraken = new KrakenWS(
    process.env.KRAKEN_WS_ENDPOINT,
    process.env.KRAKEN_PAIR,
    handleMessage
  );

const main = async() => {

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

  console.log(new Date, '[CLIENT_SENDER] Connecting to Binance and Kraken websockets... GRPC client connexion is ', with_ssl ? 'secure': 'unsecure');

  await conKraken.connect();
  await conBinance.connect();

  console.log(new Date, '[CLIENT_SENDER] BINANCE AND KRAKEN WS CONNECTED ');

  await conBinance.subscribe(process.env.BINANCE_PAIR, 'SUBSCRIBE', 1, [process.env.BINANCE_PAIR+"@"+process.env.BINANCE_METHOD+process.env.KRAKEN_ORDERBOOK_DEPTH+"@100ms"]);
  await conKraken.subscribe(process.env.KRAKEN_PAIR, process.env.KRAKEN_METHOD, {depth: parseInt(process.env.KRAKEN_ORDERBOOK_DEPTH,10)});
  
  streamOrderBook();
 
  setInterval(function() {

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(new Date, `[CLIENT_SENDER] MEMORY_USAGE = ${Math.round(used * 100) / 100} MB`);

  }, 5000);
}

main();