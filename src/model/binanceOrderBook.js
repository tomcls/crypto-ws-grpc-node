import OrderBook from './orderBook.js';

class BinanceOrderBook extends OrderBook {
  constructor(symbol) {
    let book = {
      'exchange': 'binance',
      'symbol': symbol, 
      'bids': {}, 
      'asks': {}
    };
    super(book);
  }
  updateBook(payload) {
    
    let book = {
      'exchange': this.getOrderbook().exchange,
      'symbol': this.getOrderbook().symbol, 
      'bids':{}, 
      'asks':{}
    };

    let asks =  payload['asks'];

    for(let x = 0; x < asks.length; x++) {
      book['asks'][asks[x][0]] = parseFloat(asks[x][1]);
    }

    let bids =  payload['bids'];
    for(let x = 0; x < bids.length; x++) {
      book['bids'][bids[x][0]] = parseFloat(bids[x][1]);
    }

    this.setOrderBook(book);
  }
}
export default BinanceOrderBook;