var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "";

module.exports = {
  networks: {

    localhost: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    developmentOld: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '5777'
    }
  },
  compilers: {
    solc: {
      version: "^0.8.6"
    }
  }
};