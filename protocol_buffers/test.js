/* jshint devel: true */

'use strict';

var message = require('./protocol_buffers/messages/orderbook_pb');

var orderbook = new message.OrderBook();
orderbook.setSymbol('ALGOBTC');

var kraken_bid_item = new message.OrderBook.Item();
var kraken_exchange = new message.OrderBook.Exchange();
kraken_bid_item.setPrice(0.600);
kraken_bid_item.setVolume(600);
kraken_exchange.addBids(kraken_bid_item);

var kraken_bid_item2 = new message.OrderBook.Item();
kraken_bid_item2.setPrice(0.200);
kraken_bid_item2.setVolume(200);
kraken_exchange.addBids(kraken_bid_item2);

var kraken_ask_item = new message.OrderBook.Item();
kraken_ask_item.setPrice(0.3);
kraken_ask_item.setVolume(300);
kraken_exchange.addAsks(kraken_ask_item);

var kraken_ask_item2 = new message.OrderBook.Item();
kraken_ask_item2.setPrice(0.500);
kraken_ask_item2.setVolume(500);
kraken_exchange.addAsks(kraken_ask_item2);

orderbook.setA(kraken_exchange);
orderbook.setB(binance_exchange);


var bytes   = orderbook.serializeBinary();
var orderbook_deserialized = message.OrderBook.deserializeBinary(bytes);

console.log(orderbook_deserialized);
let a = orderbook_deserialized.getA().array;
console.log(a);