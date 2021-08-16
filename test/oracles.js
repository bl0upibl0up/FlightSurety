const assert = require('assert');
var Test = require('../config/testConfig.js');
var BN = require('bignumber.js');

const TEST_ORACLES_COUNT = 30;
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

contract('Oracles', async (accounts) => {


  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    try{
      await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: web3.utils.toWei("10", "ether")});
    }
    catch(e){
      //console.log(e);
    }
  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<=TEST_ORACLES_COUNT+1; a++) {  
      try{    
        await config.flightSuretyApp.registerOracle({from: accounts[a], value: fee});
      }
      catch(e){
        //console.log(e);
      }
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can register flight', async() =>{

    let flight = 'ND2608';
    let timestamp = Math.floor(Date.now()/1000);

    let reverted = false;
    try{
      await config.flightSuretyApp.registerFlight(flight, timestamp, {from: config.firstAirline});
    }
    catch(e){
      reverted = true;
    }
    assert.equal(reverted, false, 'flight registration did not work');
  });

  it('can buy insurance', async() =>{
    let flight = 'ND0904';
    let timestamp = Math.floor(Date.now()/1000);
    let client = accounts[TEST_ORACLES_COUNT + 10];

    await config.flightSuretyApp.registerFlight(flight, timestamp, {from: config.firstAirline});
    
    let reverted = false;
    try{
      await config.flightSuretyApp.buyInsurance(config.firstAirline, flight, timestamp, {from: client, value: web3.utils.toWei("1.0001", "ether")});
    }
    catch(e){
      //console.log(e);
      reverted = true;

    }
    assert.equal(reverted, true, 'Trying to buy insurance for more than 1 eth');

    reverted = false;
    try{
      await config.flightSuretyApp.buyInsurance(config.firstAirline, flight, timestamp,{from: client, value: web3.utils.toWei("0.9", "ether")});
    }
    catch(e){
      //console.log(e);
      reverted = true;
    }
    assert.equal(reverted, false, 'Buying insurance failed');
  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let flight = 'ND3003'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);
    let client = accounts[TEST_ORACLES_COUNT+10];

    await config.flightSuretyApp.registerFlight(flight, timestamp, {from: config.firstAirline});
    await config.flightSuretyApp.buyInsurance(config.firstAirline, flight, timestamp, {from: client, value: web3.utils.toWei("0.9", "ether")});

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<=TEST_ORACLES_COUNT+1; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse.send(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
          console.log('success: ', idx, ': ', oracleIndexes[idx].toNumber());

        }
        catch(e) {
          //console.log(e);
          // Enable this when debugging
          //console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }


  });
  
});
