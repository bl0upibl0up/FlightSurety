pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract FlightSuretyData is Ownable{
    using SafeMath for uint256;
    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct InsuranceData{
        address client;
        uint256 paidAmount;
    }

    mapping(address => bool) private authorizedContracts;
    mapping(address => uint8) private registeredAirlines;

    mapping(bytes32 => InsuranceData[]) private insurancesSubscriptions;
    mapping(address => uint256) private compensations;
    mapping(bytes32 => mapping(address => bool)) insurancePerFlightPerPassenger;

    uint256 private constant airlineFee = 10 ether;
    uint256 private constant maxInsuranceValue = 1 ether;

    event AirlineRegistered(address airline);
    event AirlineFunded(address airline);
    event InsuranceBought(address client, bytes32 flightKey);
    event InsureeCredited(address client, uint256 amount);
    event CompensationWithdrawn(address client, uint256 amount);

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address _address){
        contractOwner = msg.sender;
        registeredAirlines[_address] = 1;

    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational(){
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner(){
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedContract(){
        require(authorizedContracts[msg.sender], "Caller is not authorized");
        _;
    }

    modifier checkValue() {
    _;
    uint amountToReturn = msg.value - airlineFee;
    if(amountToReturn !=0){
        address payable addrss = payable(msg.sender);
      addrss.transfer(amountToReturn);
    }
  }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() public view returns(bool){
        return operational;
    }

    function authorizeCaller(address _address) onlyOwner public{
        authorizedContracts[_address] = true;
    }
    function revokeAuthorization(address _address) onlyOwner public{
        authorizedContracts[_address] = false;
    }
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus(bool mode) onlyOwner external{
        operational = mode;
    }

    function airlineCanVote(address airline) public view returns(bool){
        return registeredAirlines[airline] == 2;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airline) requireAuthorizedContract requireIsOperational external{
        registeredAirlines[airline] = 1;
        emit AirlineRegistered(airline);
    }

    function fund(address airline) requireAuthorizedContract requireIsOperational public payable{
        if(registeredAirlines[airline] == 0){
            revert("Airline is not registered");
        }
        else if(registeredAirlines[airline] == 2){
            revert("Airline has already paid");
        }
        require(msg.value >= airlineFee, "insufficient amount");

        registeredAirlines[airline] = 2;
        emit AirlineFunded(airline);
    }

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(address client, bytes32 flightKey) requireAuthorizedContract requireIsOperational external payable{
        
        require(msg.value <= maxInsuranceValue, "Cannot pay more than 1 ether");
        require(insurancePerFlightPerPassenger[flightKey][client] == false, 'the passenger has already bought an insurance for that flight');

        InsuranceData memory data = InsuranceData({
            client: client, 
            paidAmount: msg.value
        });

        insurancesSubscriptions[flightKey].push(data);
        insurancePerFlightPerPassenger[flightKey][client] = true;
        emit InsuranceBought(client, flightKey);

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 flightKey) requireAuthorizedContract requireIsOperational external{
        
        for(uint i = 0; i < insurancesSubscriptions[flightKey].length; i++){
            address client = insurancesSubscriptions[flightKey][i].client;
            uint256 amountToPayback = insurancesSubscriptions[flightKey][i].paidAmount * 3 / 2;
            compensations[client] = amountToPayback;
            emit InsureeCredited(client, amountToPayback); 
        }
        delete(insurancesSubscriptions[flightKey]);
    }
    
    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address payable client) requireAuthorizedContract requireIsOperational external{
        uint256 amountToPayback = compensations[client];
        require(amountToPayback > 0, "nothing to payback");
        delete compensations[client];
        client.transfer(amountToPayback);

        emit CompensationWithdrawn(client, amountToPayback);

    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32){

        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    receive() external payable{
        
        fund(msg.sender);
    }


}

