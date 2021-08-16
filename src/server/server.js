import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

let oracles = new Map();
const oracleFee = '1';
const oraclesCount = 30;


flightSuretyApp.events.OracleRequest(null, (error, event) => {
  if (error) {
    console.error(error);
  } else {
    console.log('Oracle Request received');
    submitOracleResponseForIndex(event.returnValues.index, event.returnValues.airline, event.returnValues.flight, event.returnValues.timestamp);
  }
});

function registerOracles(){
  web3.eth.getAccounts((error, accs) => {
    if(error){
      console.error('could not get accounts: ', error);
    }
    else{
      //oracles starting at position 20
      for(let i = 20; i < 20 + oraclesCount; i++){
        flightSuretyApp.methods.registerOracle().send({from: accs[i], value: web3.utils.toWei(oracleFee, 'ether'), gas: 400000}).then(()=>{
          flightSuretyApp.methods.getMyIndexes().call({from:accs[i], gas: 400000}).then((indexes) =>{
            oracles.set(accs[i], indexes);
            console.log('Oracle: ', accs[i], 'registered with indexes:' , indexes);
          }).catch((err) => console.error('could not get indexes of: ', accs[i], '. Error received: ', err));
        }).catch((err) =>console.error('could not register oracle: ', accs[i], '. Error received: ', err));
      }
    }
  })
}

function submitOracleResponseForIndex(index, airline, flightName, flightTime) {
  console.log('Submitting request for airline: ', airline, ' flightName: ', flightName,
    ' flightTime: ', flightTime, ' index: ', index);
  for (let [address, indexes] of oracles) {
    if (indexes.includes(index)) {
      let statusCode = getFlightStatus();
      //let statusCode = 20;
      console.log('Oracle: ', address, ' is submitting status: ', statusCode);
      flightSuretyApp.methods.submitOracleResponse(index, airline, flightName, flightTime, statusCode)
        .send({ from: address, gas: 400000}) 
        .catch((err) => {
          console.error('Failed to submit for index: ', index, ' oracle: ',
            address, ' with indexes: ', indexes);
          console.error(err);
        })
    }
  }
};

function getFlightStatus() {
  var possibleFlightStatus = [0, 10, 20, 30, 40, 50];
  return possibleFlightStatus[Math.floor(Math.random() * possibleFlightStatus.length)];
}


const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})
registerOracles()

export default app;


