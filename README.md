# Node Websocket and GRPC app that read orderbook from Binance and Kraken
Node client server app wich merge best bids and best asks from 2 orderbooks exchanges

1. Connects to two exchanges' websocket feeds at the same time,
2. Pulls order book s, using these streaming connections, f or a given traded pair of currencies (configurable), from each exchange
3. Merges and sorts the order books to create a combined order book
4. From the combined book, publishes the spread , top ten bids , and top ten asks , as a stream, through a gRPC server

## Markets
A market is generally a pair of currencies and an exchange where they are traded. For example, ETH (Ethereum) and BTC(Bitcoin) are a pair
that together from a traded ‘symbol’, - ETHBTC. This means you can buy or sell ETH using BTC as the ‘pricing’ currency.

## Order books
Orders at which people are prepared to buy and sell are send to an exchange, such as Binance. The exchange will usually match the buy and
sell orders that approach a market ‘mid-price’. The difference between the best ask price and the best bid price is called the spread.
The final, merged order book should have the best deals first. That means, if I am selling currency and I want to be the first one to sell, I should
be at the best position for this which means am selling the largest amount at the lowest price. Think about this when sorting each side of the
order book.

## gRPC
GRPC ( https://grpc.io/ ) is relatively modern Remote Procedure Call protocol. If you have used anything like GraphQL or Thrift, it should be fairly
familiar. If not, it is not difficult to learn! If you are new to RPC you may even find you prefer gRPC’s structured and typed protocol over HTTP
Methods


![Alt text](https://github.com/tomcls/crypto-ws-grpc-node/raw/main/assets/images/crypto-ws-grpc.png "A picture is sometimes better than a long speech")


## Installation

```
sudo n 14 
cd crypto-ws-grpc-node
npm install
```

## App details

```
.
├── LICENSE
├── package.json
├── protocol_buffers # Not used for the app, just to for testing purpose and understanding
│   ├── definitions
│   │   └── orderbook.proto
│   ├── messages
│   │   ├── orderbook.js
│   │   └── orderbook_pb.js
│   └── test.js
├── protos
│   └── orderbook.proto
├── README.md
├── src
│   ├── binanceOrderBook.js # Format the data from Binance
│   ├── binancews.js # Class that consumes the orderbook from Binance via WebSocket 
│   ├── client-receiver.js # Job that retrieves data from grpc server and display the best spread between binance & kraken
│   ├── client-sender.js # Job that retrieves data from Kraken & Binance and sends it to the grpc server
│   ├── krakenOrderBook.js # Format the data from Kraken
│   ├── krakenws.js # Class that consumes the orderbook from Kraken via WebSocket 
│   ├── orderBook.js # Class that has common methods for the related excahnges orderbook that inherit from it
│   └── server.js # Launch a grpc server
└── srv # run the project with docker
    ├── receiver
    │   ├── Dockerfile
    │   ├── run.sh
    │   └── start.sh
    ├── sender
    │   ├── Dockerfile
    │   ├── run.sh
    │   └── start.sh
    └── server
        ├── Dockerfile
        ├── run.sh
        └── start.sh

```

## Run the project
0. rename .env.example to .env
```
cd crypto-ws-grpc-node && mv .env.example .env
```
1. First, run the server
```
cd crypto-ws-grpc-node && npm run start-server
```
2. Next, start the receiver on another shell
```
cd crypto-ws-grpc-node && npm run start-receiver 
```
3. Finally, start the sender on another shell
```
cd crypto-ws-grpc-node && npm run start-sender 
```
## Run with Docker

1. First, run the server
```
cd crypto-ws-grpc-node && ./srv/server/run.sh
```
2. Next, start the receiver
```
cd crypto-ws-grpc-node && ./srv/receiver/run.sh
```
3. Finally, start the sender
```
cd crypto-ws-grpc-node && ./srv/sender/run.sh
```
To see the result please use 'run docker logs'


## References

### GRPC Node js

https://grpc.io/docs/languages/node/basics/

### Kraken 

https://docs.kraken.com/websockets/

https://support.kraken.com/hc/en-us/articles/360027677512-Example-order-book-code-Python-

### Binance

https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md

This stream is currently used in the app
https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#partial-book-depth-streams

But you can use this one with a bit more logic (better way i think)
https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#how-to-manage-a-local-order-book-correctly
