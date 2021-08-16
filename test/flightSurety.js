var Test = require('../config/testConfig.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: accounts[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    let reverted = false;
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
        //console.log(e);
        reverted = true;
    }
    //let result = await config.flightSuretyData.airlineCanVote.call(newAirline); 

    // ASSERT
    assert.equal(reverted, true, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) can register an airline using registerAirline() after funding', async() => {
    
    let reverted = false;
    let newAirline = accounts[2];
    try{
        await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: web3.utils.toWei("10", "ether")});
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e){
        console.log(e);
        reverted = true;
    }
    assert.equal(reverted, false, "Airline failed to fund and register a new airline");
  });

  it('(airline) can register the subsequent 3 airlines', async() =>{
    let airline2 = accounts[2];
    let airline3 = accounts[3];
    let airline4 = accounts[4];
    let reverted = false;
    try{
        await config.flightSuretyApp.fundAirline({from: airline2, value: web3.utils.toWei("10", "ether")});
        await config.flightSuretyApp.registerAirline(airline3, {from: airline2});
        await config.flightSuretyApp.registerAirline(airline4, {from: airline2});
        await config.flightSuretyApp.fundAirline({from: airline3, value: web3.utils.toWei("10", "ether")});
        await config.flightSuretyApp.fundAirline({from: airline4, value: web3.utils.toWei("10", "ether")});
    }
    catch(e){
        reverted = true;
    }    
    assert.equal(reverted, false, "registration of the first four airlines failed");
    reverted = false;
    try{
        await config.flightSuretyApp.fundAirline({from: airline2, value: web3.utils.toWei("10", "ether")});
    }
    catch(e){
        //console.log(e);
        reverted = true;
    }
    assert.equal(reverted, true, "airline cannot pay twice");
  });

  it('(multiparty) fifth and subsequent airlines need at least 50% of votes', async() =>{
      let airline2 = accounts[2];
      let airline3 = accounts[3];  
      let airline4 = accounts[4];
      let airline5 = accounts[5];
      let reverted = false;
      try{
          await config.flightSuretyApp.registerAirline(airline5, {from: airline1});
          await config.flightSuretyApp.fundAirline({from: airline5, value: web3.utils.toWei("10", "ether")});
      }
      catch(e){
          reverted = true;
      }
      assert.equal(reverted, true, 'airline should not be able to fund');

      reverted = false;
      try{
          await config.flightSuretyApp.registerAirline(airline5, {from: airline1});
      }
      catch(e){
          reverted = true;
      }
      assert.equal(reverted, true, 'airline should not be able to vote twice')

      reverted = false;
      try{
          await config.flightSuretyApp.registerAirline(airline5, {from: airline2});
          await config.flightSuretyApp.registerAirline(airline5, {from: airline3});
          //await config.flightSuretyApp.registerAirline(airline5, {from: airline4});
          await config.flightSuretyApp.fundAirline({from: airline5, value: web3.utils.toWei("10", "ether")});
      }
      catch(e){
          console.log(e);
          reverted = true;
      }
      assert.equal(reverted, false, 'airline should be able to fund');
  })
 

});
