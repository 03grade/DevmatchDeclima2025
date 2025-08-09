// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { encryptCallData } from "@oasisprotocol/sapphire-contracts/contracts/CalldataEncryption.sol";
import { EIP155Signer } from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";

/**
 * @title ConfidentialProxy
 * @dev A proxy contract that creates truly CONFIDENTIAL format transactions
 * using EIP155Signer and encryptCallData for D-Climate sensors
 */
contract ConfidentialProxy {
    struct EthereumKeypair {
        address addr;
        bytes32 secret;
        uint64 nonce;
    }

    EthereumKeypair private kp;
    address public owner;
    address public sensorContract;

    event ConfidentialTransactionCreated(address indexed user, bytes32 indexed txHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _sensorContract) {
        owner = msg.sender;
        sensorContract = _sensorContract;
    }

    /**
     * @notice Set the keypair used for signing confidential transactions
     * @param keypair The Ethereum keypair for transaction signing
     */
    function setKeypair(EthereumKeypair memory keypair) external payable onlyOwner {
        kp = keypair;
    }

    /**
     * @notice Create a CONFIDENTIAL format transaction for sensor minting
     * @param sensorId The sensor ID to mint
     * @param ipfsMetadata The IPFS metadata for the sensor
     * @return output Raw signed transaction in CONFIDENTIAL format
     */
    function makeConfidentialMintTx(
        string calldata sensorId, 
        string calldata ipfsMetadata
    ) external view returns (bytes memory output) {
        
        // Encode the sensor minting function call
        bytes memory mintCall = abi.encodeWithSignature(
            "mintSensor(string,string)", 
            sensorId, 
            ipfsMetadata
        );

        // Create CONFIDENTIAL transaction with encrypted calldata
        return EIP155Signer.sign(
            kp.addr,
            kp.secret,
            EIP155Signer.EthTx({
                nonce: kp.nonce,
                gasPrice: 100_000_000_000,
                gasLimit: 500000,
                to: sensorContract,
                value: 0,
                data: encryptCallData(mintCall), // This makes it CONFIDENTIAL format
                chainId: block.chainid
            })
        );
    }

    /**
     * @notice Create a CONFIDENTIAL format transaction for climate data submission
     * @param sensorId The sensor ID
     * @param ipfsCid The IPFS CID of encrypted climate data
     * @param encryptedKey The encrypted key for data decryption
     * @param recordHash The hash of the climate data record
     * @return output Raw signed transaction in CONFIDENTIAL format
     */
    function makeConfidentialDataTx(
        string calldata sensorId,
        string calldata ipfsCid,
        bytes calldata encryptedKey,
        bytes32 recordHash
    ) external view returns (bytes memory output) {
        
        // Encode the data submission function call
        bytes memory dataCall = abi.encodeWithSignature(
            "submitDataBatch(string,string,bytes,bytes32)",
            sensorId,
            ipfsCid,
            encryptedKey,
            recordHash
        );

        // Create CONFIDENTIAL transaction with encrypted calldata
        return EIP155Signer.sign(
            kp.addr,
            kp.secret,
            EIP155Signer.EthTx({
                nonce: kp.nonce + 1, // Increment nonce for next transaction
                gasPrice: 100_000_000_000,
                gasLimit: 300000,
                to: sensorContract, // Assuming data registry contract address
                value: 0,
                data: encryptCallData(dataCall), // This makes it CONFIDENTIAL format
                chainId: block.chainid
            })
        );
    }

    /**
     * @notice Execute a confidential proxy transaction
     * @param data The encoded transaction data
     */
    function executeConfidentialTx(bytes memory data) external payable {
        (bool success, bytes memory result) = sensorContract.call{value: msg.value}(data);
        
        if (!success) {
            // Revert with meaningful error
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        
        // Increment nonce after successful execution
        kp.nonce += 1;
        
        emit ConfidentialTransactionCreated(msg.sender, keccak256(data));
    }

    /**
     * @notice Get current nonce
     * @return Current nonce value
     */
    function getCurrentNonce() external view returns (uint64) {
        return kp.nonce;
    }

    /**
     * @notice Update sensor contract address
     * @param _sensorContract New sensor contract address
     */
    function updateSensorContract(address _sensorContract) external onlyOwner {
        sensorContract = _sensorContract;
    }

    /**
     * @notice Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @notice Accept ETH deposits
     */
    receive() external payable {}
}