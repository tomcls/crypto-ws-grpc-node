import WebSocket from 'ws';
import EventEmitter   from 'events';
import BinanceOrderBook from './binanceOrderBook.js';

class BinanceWS extends EventEmitter {

  constructor(url = 'wss://stream.binance.com:9443/ws', pair='ALGOBTC', depth=10, method='depth') {
    console.log(url,pair)
    super();

    this.url = url;
    this.pair = pair.toLowerCase();
    this.pairs = {};
    this.lastMessageAt = 0;
    this.connected = false;
    this.orderBook = new BinanceOrderBook( this.pair);
    this.method = method;
    this.depth = depth;
  }

  disconnect() {
    this.ws.disconnect();
  }

  connect() {

    if(this.connected) {
      return;
    }

    let readyHook;
    this.onOpen = new Promise(r => readyHook = r);

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      readyHook();
    }

    this.ws.onerror = e => {
      console.log(new Date, '[BINANCE] error', e);
    }
    this.ws.onclose = e => {
      console.log(new Date, '[BINANCE] close', e);
    }
    this.ws.on('pong', (e) => {
      console.log(new Date, '[BINANCE] pong');
    });
    this.ws.on('ping', (e) => {
      console.log(new Date, '[BINANCE] ping');
    });

    // initial book data coming in on the same tick as the subscription data
    // we defer this so the subscription promise resloves before we send
    // initial OB data.
    this.ws.onmessage = e => setImmediate(() => this.handleMessage(e));

    this.pingPong();

    return this.onOpen;
  }
  pingPong() {
    setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        console.log("ping server");
      }
    }, 5000);
  }
  handleMessage = e => {
    this.lastMessageAt = + new Date;
    const payload = JSON.parse(e.data);
    
    if(payload && payload.asks && payload.asks[0]) {
      this.orderBook.updateBook(payload);
      this.emit('channel:' + this.pair+'@'+this.method+this.depth+'@100ms',this.orderBook.getOrderbook());
    } else {

      if( payload["result"] !== undefined  && payload.id == 1) {
        
        if(this.pairs[this.pair]) {
          this.pairs[this.pair].onReady(payload.id);
          console.log(new Date, '[BINANCE] received subscription ',this.pairs[this.pair]);
        } else {
          console.log(new Date, '[BINANCE] received subscription event for unknown subscription', payload);
        }
        return;
      }
      this.emit('message', payload);
    }
  }

  subscribe(pair, method, id, params) {
    console.log('subscribe',pair, method, params, id);
    if(this.pairs[pair] && this.pairs[pair].method === method && this.pairs[pair].id === id) {
      console.log(new Date, '[BINANCE] refusing to subscribe to subscription twice', {pair, method});
      return;
    }

    let hook;
    let onReady = new Promise(r => hook = r);

    if(!this.pairs[pair]) {
      this.pairs[pair] = {
        id : id,
        method: method,
        onReady: hook
      };
    }

    this.pairs[pair].method = method;

    this._subscribe(method, id, params);

    return onReady;
  }

  _subscribe(method, id, params = []) {
    
    let subscribe = {
      "method": method,
      "params": params,
      "id": id
    }
    console.log('_subscribe', subscribe);
    this.ws.send(JSON.stringify(subscribe));
    /* {
        "method": "SUBSCRIBE",
        "params":
        [
        "algobtc@depth"
        ],
        "id": 1
        }*/
  }

}

export default BinanceWS;