//github page consulted for the dapp: https://github.com/georgesdib/flight_surety_project/
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let contract = new Contract('localhost', () => {

        contract.addEventsListener(displayEvents);

        handleAppOperational(contract);
        handleDataOperational(contract);

        handleAppOperationalChange(contract, 'app-operational', true);
        handleAppOperationalChange(contract, 'app-not-operational', false);

        handleDataOperationalChange(contract, 'data-operational', true);
        handleDataOperationalChange(contract, 'data-not-operational', false);

        DOM.elid('fund-airline').addEventListener('click', () => {

            contract.fundAirline((error, result) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('Airline paid the fees');
                    console.log(result);
                }
            });
        })

        DOM.elid('claim-insurance').addEventListener('click', () => {

            contract.claimInsurance((error, result) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('Passenger claimed insurance');
                    console.log(result);
                }
            });
        })

        DOM.elid('register-airline').addEventListener('click', () => {

            let airline = DOM.elid('airline-to-be-registered-address').value;

            contract.registerAirline(airline, (error, result) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('Airline registered');
                    console.log(result);
                }
            });
        })

        DOM.elid('register-flight').addEventListener('click', () => {
            let flightName = DOM.elid('flight-name').value;
            let flightTime = DOM.elid('flight-time').value;

            contract.registerFlight(flightName, flightTime, (error, result) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('Flight registered');
                    console.log(result);
                }
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let insuranceValue = DOM.elid('insurance-value').value;
            if (insuranceValue !== null && insuranceValue !== "") {
                let airline = DOM.elid('airline-of-flight').value;
                let flightName = DOM.elid('flight-name').value;
                let flightTime = DOM.elid('flight-time').value;
                
                contract.buyInsurance(airline, flightName, flightTime, insuranceValue, (error, result) => {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log('Passenger bought insurance');
                        console.log(result);
                    }
                });
            }
        })

        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flightName = DOM.elid('flight-name').value;
            let flightTime = DOM.elid('flight-time').value;
            let airline = DOM.elid('airline-of-flight').value;

            contract.fetchFlightStatus(airline, flightName, flightTime, (error, result) => {});
        })
    
    });
    

})();
function handleAppOperational(contract) {
    contract.isAppOperational((error, result) => {
        if (error) {
            console.error(error);
        } else if (result.toString() === 'true') {
            DOM.elid('app-operational').checked = true;
        } else {
            DOM.elid('app-not-operational').checked = true;
        }
    })
}
function handleDataOperational(contract) {
    contract.isDataOperational((error, result) => {
        if (error) {
            console.error(error);
        } else if (result.toString() === 'true') {
            DOM.elid('data-operational').checked = true;
        } else {
            DOM.elid('data-not-operational').checked = true;
        }
    })
}
function handleAppOperationalChange(contract, id, mode) {
    DOM.elid(id).addEventListener('change', () => {
        contract.setAppOperatingStatus(mode, (error, result) => {
            if (error) {
                console.error(error);
            }
        });
    });
}
function handleDataOperationalChange(contract, id, mode) {
    DOM.elid(id).addEventListener('change', () => {
        contract.setDataOperatingStatus(mode, (error, result) => {
            if (error) {
                console.error(error);
            }
        });
    });
}
function displayEvents(data){
    let eventsDiv = DOM.elid('txt-events');
    let line = DOM.line({}, String(data));
    eventsDiv.append(line);
    console.log(typeof(eventsDiv));
}