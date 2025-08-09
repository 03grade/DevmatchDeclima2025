// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./SensorNFA.sol";

/**
 * @title DataRegistry
 * @dev Registry for climate data submissions with confidential processing via Oasis Sapphire
 * Handles encrypted data storage references and validation through ROFL
 */
contract DataRegistry is Ownable, ReentrancyGuard {
    using Sapphire for bytes;
    
    // Data submission structure
    struct DataSubmission {
        string sensorId;           // Sensor identifier
        string ipfsCid;            // IPFS content identifier for encrypted data
        bytes32 recordHash;        // SHA-256 hash of canonicalized data
        bytes encryptedKey;        // AES key encrypted with Sapphire
        uint256 timestamp;         // Submission timestamp
        address submitter;         // Address that submitted the data
        bool isValidated;          // ROFL validation status
        uint256 validationTime;    // When validation completed
        string validationResult;   // Validation result from ROFL
    }
    
    // Events
    event DataSubmitted(
        string indexed sensorId,
        string indexed ipfsCid,
        bytes32 indexed recordHash,
        address submitter,
        uint256 timestamp
    );
    
    event DataValidated(
        string indexed sensorId,
        string indexed ipfsCid,
        bool isValid,
        string result,
        uint256 validationTime
    );
    
    event BatchProcessed(
        string indexed sensorId,
        uint256 batchSize,
        uint256 validCount,
        uint256 timestamp
    );
    
    // State variables
    SensorNFA public immutable sensorNFA;
    
    mapping(string => DataSubmission[]) public sensorData;  // sensorId => submissions
    mapping(string => bool) public usedCids;  // CID => used (replay protection)
    mapping(bytes32 => bool) public usedHashes;  // hash => used (replay protection)
    mapping(string => uint256) public lastSubmissionTime;  // sensorId => timestamp
    
    // ROFL authorized addresses
    mapping(address => bool) public authorizedROFL;
    
    // Configuration
    uint256 public constant MIN_SUBMISSION_INTERVAL = 300; // 5 minutes
    uint256 public constant MAX_SUBMISSION_INTERVAL = 86400; // 24 hours
    uint256 public constant VALIDATION_TIMEOUT = 600; // 10 minutes
    
    constructor(address initialOwner, address _sensorNFA) Ownable(initialOwner) {
        sensorNFA = SensorNFA(_sensorNFA);
    }
    
    /**
     * @dev Add authorized ROFL address (only owner)
     */
    function addAuthorizedROFL(address roflAddress) external onlyOwner {
        authorizedROFL[roflAddress] = true;
    }
    
    /**
     * @dev Remove authorized ROFL address (only owner)
     */
    function removeAuthorizedROFL(address roflAddress) external onlyOwner {
        authorizedROFL[roflAddress] = false;
    }
    
    /**
     * @dev Modifier to check if caller is authorized ROFL
     */
    modifier onlyAuthorizedROFL() {
        require(authorizedROFL[msg.sender], "Not authorized ROFL");
        _;
    }
    
    /**
     * @dev Submit encrypted climate data batch
     * @param sensorId Sensor identifier from NFA
     * @param ipfsCid IPFS content identifier for encrypted data
     * @param encryptedKey AES key encrypted with Sapphire
     * @param recordHash SHA-256 hash of canonicalized batch readings
     */
    function submitDataBatch(
        string calldata sensorId,
        string calldata ipfsCid,
        bytes calldata encryptedKey,
        bytes32 recordHash
    ) external nonReentrant {
        // Validate sensor ownership and activity
        require(
            sensorNFA.isSensorActiveAndOwned(sensorId),
            "Sensor not active or not owned by caller"
        );
        
        // Replay protection
        require(!usedCids[ipfsCid], "CID already used");
        require(!usedHashes[recordHash], "Record hash already used");
        require(bytes(ipfsCid).length > 0, "Invalid IPFS CID");
        require(encryptedKey.length > 0, "Invalid encrypted key");
        
        // Check submission timing
        uint256 lastTime = lastSubmissionTime[sensorId];
        uint256 timeSinceLastSubmission = block.timestamp - lastTime;
        
        if (lastTime > 0) {
            require(
                timeSinceLastSubmission >= MIN_SUBMISSION_INTERVAL,
                "Submission too frequent"
            );
            require(
                timeSinceLastSubmission <= MAX_SUBMISSION_INTERVAL,
                "Submission too delayed"
            );
        }
        
        // Create submission record
        DataSubmission memory submission = DataSubmission({
            sensorId: sensorId,
            ipfsCid: ipfsCid,
            recordHash: recordHash,
            encryptedKey: encryptedKey,
            timestamp: block.timestamp,
            submitter: msg.sender,
            isValidated: false,
            validationTime: 0,
            validationResult: ""
        });
        
        // Store submission
        sensorData[sensorId].push(submission);
        usedCids[ipfsCid] = true;
        usedHashes[recordHash] = true;
        lastSubmissionTime[sensorId] = block.timestamp;
        
        // Update sensor submission count
        sensorNFA.recordSubmission(sensorId);
        
        emit DataSubmitted(sensorId, ipfsCid, recordHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Validate data submission (only authorized ROFL)
     * @param sensorId Sensor identifier
     * @param ipfsCid IPFS content identifier
     * @param isValid Validation result
     * @param result Validation details
     */
    function validateDataSubmission(
        string calldata sensorId,
        string calldata ipfsCid,
        bool isValid,
        string calldata result
    ) external onlyAuthorizedROFL {
        require(bytes(ipfsCid).length > 0, "Invalid CID");
        
        // Find the submission
        DataSubmission[] storage submissions = sensorData[sensorId];
        bool found = false;
        
        for (uint256 i = 0; i < submissions.length; i++) {
            if (keccak256(bytes(submissions[i].ipfsCid)) == keccak256(bytes(ipfsCid))) {
                require(!submissions[i].isValidated, "Already validated");
                require(
                    block.timestamp - submissions[i].timestamp <= VALIDATION_TIMEOUT,
                    "Validation timeout exceeded"
                );
                
                submissions[i].isValidated = true;
                submissions[i].validationTime = block.timestamp;
                submissions[i].validationResult = result;
                found = true;
                break;
            }
        }
        
        require(found, "Submission not found");
        
        // Update sensor reputation based on validation result
        if (isValid) {
            _increaseReputation(sensorId, "Valid data submission");
        } else {
            _decreaseReputation(sensorId, "Invalid data submission");
        }
        
        emit DataValidated(sensorId, ipfsCid, isValid, result, block.timestamp);
    }
    
    /**
     * @dev Process multiple validations in batch (only authorized ROFL)
     * @param sensorId Sensor identifier
     * @param ipfsCids Array of IPFS content identifiers
     * @param validationResults Array of validation results
     * @param results Array of validation details
     */
    function validateDataBatch(
        string calldata sensorId,
        string[] calldata ipfsCids,
        bool[] calldata validationResults,
        string[] calldata results
    ) external onlyAuthorizedROFL {
        require(
            ipfsCids.length == validationResults.length && 
            validationResults.length == results.length,
            "Array length mismatch"
        );
        
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < ipfsCids.length; i++) {
            try this.validateDataSubmission(sensorId, ipfsCids[i], validationResults[i], results[i]) {
                if (validationResults[i]) {
                    validCount++;
                }
            } catch {
                // Continue processing other validations
            }
        }
        
        emit BatchProcessed(sensorId, ipfsCids.length, validCount, block.timestamp);
    }
    
    /**
     * @dev Get submissions for a sensor with pagination
     * @param sensorId Sensor identifier
     * @param offset Starting index
     * @param limit Number of submissions to return
     */
    function getSensorSubmissions(
        string calldata sensorId,
        uint256 offset,
        uint256 limit
    ) external view returns (DataSubmission[] memory) {
        DataSubmission[] storage submissions = sensorData[sensorId];
        
        if (offset >= submissions.length) {
            return new DataSubmission[](0);
        }
        
        uint256 end = offset + limit;
        if (end > submissions.length) {
            end = submissions.length;
        }
        
        DataSubmission[] memory result = new DataSubmission[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = submissions[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get total submission count for a sensor
     * @param sensorId Sensor identifier
     */
    function getSensorSubmissionCount(string calldata sensorId) external view returns (uint256) {
        return sensorData[sensorId].length;
    }
    
    /**
     * @dev Get recent submissions across all sensors (public explorer)
     * @param limit Number of recent submissions to return
     */
    function getRecentSubmissions(uint256 limit) external view returns (
        string[] memory sensorIds,
        string[] memory ipfsCids,
        uint256[] memory timestamps,
        bool[] memory isValidated
    ) {
        // This is a simplified implementation for the public explorer
        // In production, you'd want to optimize this with better indexing
        
        sensorIds = new string[](limit);
        ipfsCids = new string[](limit);
        timestamps = new uint256[](limit);
        isValidated = new bool[](limit);
        
        // Note: This is a placeholder implementation
        // Real implementation would require proper indexing of all submissions
    }
    
    /**
     * @dev Check if data can be accessed by requester
     * @param sensorId Sensor identifier
     * @param requester Address requesting access
     */
    function canAccessSensorData(string calldata sensorId, address requester) 
        external 
        view 
        returns (bool) 
    {
        // Only sensor owner can access encrypted data
        uint256 tokenId = sensorNFA.sensorIdToTokenId(sensorId);
        return sensorNFA.ownerOf(tokenId) == requester;
    }
    
    /**
     * @dev Internal function to increase sensor reputation
     */
    function _increaseReputation(string memory sensorId, string memory reason) internal {
        uint256 currentRep = sensorNFA.getSensorReputation(sensorId);
        uint256 newRep = currentRep + 1;
        if (newRep > 200) newRep = 200;
        
        sensorNFA.updateReputation(sensorId, newRep, reason);
    }
    
    /**
     * @dev Internal function to decrease sensor reputation
     */
    function _decreaseReputation(string memory sensorId, string memory reason) internal {
        uint256 currentRep = sensorNFA.getSensorReputation(sensorId);
        uint256 newRep = currentRep > 5 ? currentRep - 5 : 0;
        
        sensorNFA.updateReputation(sensorId, newRep, reason);
    }
}