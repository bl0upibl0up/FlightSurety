//github page consulted for the dapp: https://github.com/georgesdib/flight_surety_project/
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';


export default class Contract {
    constructor(network, callback) {

        this.config = Config[network];
        this.initialize(callback);
    }

    initialize(callback) {

        this.web3 = new Web3(window.ethereum);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, this.config.dataAddress);

        window.ethereum.request({ method: 'eth_requestAccounts' });

        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error('Failed to get accounts: ', error);
            } else {
                callback();
            }
        });
    }

    addEventsListener(callback) {
        this.flightSuretyApp.events.allEvents(null, (error, result) => {
            this.handleAppEvent(result, callback);
        });
        this.flightSuretyData.events.allEvents(null, (error, result) => {
            this.handleDataEvent(result, callback);
        });
    }
    
    handleAppEvent(result, callback){
        let text;
        let statusCode = null;
        switch(result.event){
            case 'FlightRegistered': 
                text = "Flight " + result.returnValues['flightName'] + ' scheduled at ' + result.returnValues['flightTime'] +' from airline ' + result.returnValues['airline'] + ' is registered';
                break;
            case 'OracleRequest': 
                text = 'Oracles requested with index: ' + result.returnValues['index'] + ' for flight ' + result.returnValues['flightName'] + ' scheduled at ' + result.returnValues['flightTime'] +
                ' from airline ' + result.returnValues['airline'];
                break;
            case 'OracleReport':
                text = 'Oracle Reported for airline: ' + result.returnValues['airline'] + ', flight: ' +
                    result.returnValues['flight'] + ', at time: ' + result.returnValues['timestamp'] +
                    ', with status: ' + result.returnValues['statusCode'];
                break;
            case 'FlightStatusInfo':
                text = 'Flight Status Info: airline: ' + result.returnValues['airline'] + ' flight: ' +
                    result.returnValues['flight'] + ', time: ' + result.returnValues['timestamp'] +
                    ' with status: ' + result.returnValues['status'];
                statusCode = result.returnValues['status'];
                break;
            default:
                text = result.event;
                break;
        }
        console.log(result);

        callback(text + '. Tx Hash: ' + result.transactionHash, statusCode);
    }


    handleDataEvent(result, callback){
        let text;
        let statusCode = null;
        switch(result.event){
            case 'AirlineRegistered':
                text = "Airline " + result.returnValues['airline'] + " registered";  
                break;
            case 'AirlineFunded': 
                text = "Airline " + result.returnValues['airline'] + " paid the fees";
            break;
            case 'InsuranceBought':
                text = result.returnValues['client'] + ' has bought insurance for flight ' +
                    result.returnValues['flightKey'];
            break;
            case 'InsureeCredited':
                text = 'Insuree ' + result.returnValues['client'] + ' credited';
                break;
            case 'CompensationWithdrawn':
                text = 'Insuree ' + result.returnValues['client'] + ' has claim is funds';
                break;
            default:
                text = result.event;
                break;
        }
        console.log(result);

        callback(text + '. Tx Hash: ' + result.transactionHash, statusCode);

    }

    fundAirline(callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                let value = this.web3.utils.toWei("10", "ether");
                self.flightSuretyApp.methods.fundAirline().send({from: accs[0], value: value}, callback);
            }
        });
    }

    claimInsurance(callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                self.flightSuretyApp.methods.claimInsurance().send({from: accs[0]}, callback);
            }
        });
    }

    registerAirline(airline, callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                self.flightSuretyApp.methods.registerAirline(airline).send({from: accs[0]}, callback);
            }
        });
    }

    registerFlight(flightName, flightTime, callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                self.flightSuretyApp.methods.registerFlight(flightName, flightTime).send({from: accs[0]}, callback);
            }
        });
    }

    buyInsurance(airline, flightName, flightTime, amount, callback) {
        let self = this;
        let amountWei = this.web3.utils.toWei(amount, "ether");
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                self.flightSuretyApp.methods.buyInsurance(airline, flightName, flightTime).send({from: accs[0], value: amountWei}, callback);
            }
        });
    }

    isAppOperational(callback) {
        this.flightSuretyApp.methods.isOperational().call(null, callback);
    }

    isDataOperational(callback) {
        this.flightSuretyData.methods.isOperational().call(null, callback);
    }

    setAppOperatingStatus(mode, callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                self.flightSuretyApp.methods.setOperatingStatus(mode).send({ from: accs[0] }, callback);
            }
        });
    }

    setDataOperatingStatus(mode, callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                self.flightSuretyData.methods.setOperatingStatus(mode).send({from: accs[0]}, callback);
            }
        });
    }

    fetchFlightStatus(airline, flightName, flightTime, callback) {
        let self = this;
        this.web3.eth.getAccounts((error, accs) => {
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                self.flightSuretyApp.methods.fetchFlightStatus(airline, flightName, flightTime).send({from: accs[0]}, (error, result) => {
                    callback(error, null);
                });
            }
        });
    }
}