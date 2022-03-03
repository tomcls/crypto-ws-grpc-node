import OrderBook from "./orderBook.js";

class KrakenOrderBook extends OrderBook {
  constructor(symbol) {
    let book = {"exchange": "kraken", "symbol": symbol, "bids":{}, "asks":{}};
    super(book);
  }
  processOrderBook(payload) {
    if(Array.isArray(payload)) {
        if(Array.isArray(payload[1]['as']) ) {
            this.updateBook("asks", payload[1]['as']);
            this.updateBook("bids", payload[1]['bs']);
        } else if(Array.isArray(payload[1]['a']) ) {
            this.updateBook("asks", payload[1]['a']);
        } else if(Array.isArray(payload[1]['b'])) {
            this.updateBook("bids", payload[1]['b']);
        }
    }
  }
  updateBook(side, data){
    
    for(let i=0; i < data.length; i++) {
        let price_level = data[i][0];
        if( parseFloat(data[i][1]) != 0.0) {
            this.getOrderbook()[side][price_level] = parseFloat(data[i][1]);
        } else {
            if( this.getOrderbook()[price_level]) {
              this.deleteLastItem(price_level)
            }
        }
    }
    if(side === "bids") {
      const sortable = Object.fromEntries(
        Object.entries(this.getOrderbook()["bids"]).sort( function([a],[b]) {
            return b-a
        } )
      );
      this.getOrderbook()["bids"] = sortable;
    }
    if(side === "ask") {
      const sortable = Object.fromEntries(
        Object.entries(this.getOrderbook()["asks"]).sort( function([a],[b]) {
            return a-b
        } )
      );
      this.getOrderbook()["asks"] = sortable;
    }
    let k = Object.keys(this.getOrderbook()["asks"])
    if(k.length > 10) {
      this.deleteLastItem("asks",k)
    }
    k = Object.keys(this.getOrderbook()["bids"])
    if(k.length > 10) {
      this.deleteLastItem("bids",k)
    }
  }
}
export default KrakenOrderBook;