class OrderBook {
  constructor(book) {
    this.book = book;
  }
  getOrderbook() {
    return this.book;
  }
  getSymbol() {
    return this._data.symbol;
  }
  getBestBid() {
    return this._data.bids[0][0];
  }
  getBestAsk() {
    return this._data.asks[0][0];
  }
  deleteItem(key) {
    delete this.book[key];
  }
  deleteLastItem(side,keys) {
    delete this.book[side][keys[keys.length-1]];
  }
  setOrderBook(book) {
    this.book = book;
  }
}
export default OrderBook;