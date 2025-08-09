// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./SensorNFA.sol";
import "./DataRegistry.sol";

/**
 * @title RewardDistributor
 * @dev Manages daily ROSE reward distribution for climate data contributions
 * Uses Oasis Sapphire for confidential reward calculations
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    using Sapphire for bytes;
    
    // Reward calculation structure
    struct RewardCalculation {
        uint256 baseReward;        // Base daily reward in ROSE
        uint256 qualityMultiplier; // Quality-based multiplier (1000 = 1.0x)
        uint256 frequencyBonus;    // Frequency bonus in ROSE
        uint256 reputationBonus;   // Reputation-based bonus in ROSE
        uint256 totalReward;       // Final calculated reward
        uint256 calculationTime;   // When reward was calculated
    }
    
    // Reward claim structure  
    struct RewardClaim {
        string sensorId;           // Sensor identifier
        uint256 amount;            // Reward amount in ROSE
        uint256 earnedDate;        // Date reward was earned (day timestamp)
        uint256 claimableAfter;    // Timestamp when reward becomes claimable
        bool claimed;              // Whether reward has been claimed
        RewardCalculation calculation; // Detailed calculation breakdown
    }
    
    // Events
    event RewardCalculated(
        string indexed sensorId,
        uint256 indexed earnedDate,
        uint256 amount,
        address indexed owner
    );
    
    event RewardClaimed(
        string indexed sensorId,
        address indexed claimer,
        uint256 amount,
        uint256 earnedDate
    );
    
    event RewardParametersUpdated(
        uint256 baseReward,
        uint256 lockupPeriod,
        uint256 timestamp
    );
    
    event BatchRewardsProcessed(
        uint256 sensorsProcessed,
        uint256 totalRewardsDistributed,
        uint256 timestamp
    );
    
    // State variables
    SensorNFA public immutable sensorNFA;
    DataRegistry public immutable dataRegistry;
    
    // Reward configuration (DAO-controllable)
    uint256 public baseRewardAmount = 10 ether; // 10 ROSE base reward
    uint256 public rewardLockupPeriod = 1 days; // 24 hour lockup
    uint256 public minReputationForReward = 50; // Minimum reputation to earn rewards
    uint256 public maxReputationMultiplier = 2000; // 2.0x max multiplier (1000 = 1.0x)
    
    // ROFL authorized addresses
    mapping(address => bool) public authorizedROFL;
    
    // Reward tracking
    mapping(string => mapping(uint256 => RewardClaim)) public sensorRewards; // sensorId => earnedDate => claim
    mapping(string => uint256) public lastRewardDate; // sensorId => last reward date
    mapping(address => uint256) public totalEarned; // user => total ROSE earned
    mapping(address => uint256) public totalClaimed; // user => total ROSE claimed
    
    // Daily submission tracking for frequency bonuses
    mapping(string => mapping(uint256 => uint256)) public dailySubmissions; // sensorId => date => count
    
    constructor(
        address initialOwner,
        address _sensorNFA,
        address _dataRegistry
    ) Ownable(initialOwner) {
        sensorNFA = SensorNFA(_sensorNFA);
        dataRegistry = DataRegistry(_dataRegistry);
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
     * @dev Update reward parameters (only owner - controlled by DAO)
     */
    function updateRewardParameters(
        uint256 _baseRewardAmount,
        uint256 _lockupPeriod,
        uint256 _minReputation,
        uint256 _maxMultiplier
    ) external onlyOwner {
        baseRewardAmount = _baseRewardAmount;
        rewardLockupPeriod = _lockupPeriod;
        minReputationForReward = _minReputation;
        maxReputationMultiplier = _maxMultiplier;
        
        emit RewardParametersUpdated(_baseRewardAmount, _lockupPeriod, block.timestamp);
    }
    
    /**
     * @dev Calculate reward for a sensor for a specific date (only authorized ROFL)
     * @param sensorId Sensor identifier
     * @param earnedDate Date for which reward is calculated (day timestamp)
     * @param validSubmissions Number of valid submissions for the day
     * @param qualityScore Quality score from data validation (0-1000)
     */
    function calculateReward(
        string calldata sensorId,
        uint256 earnedDate,
        uint256 validSubmissions,
        uint256 qualityScore
    ) external onlyAuthorizedROFL {
        require(sensorNFA.sensorExists(sensorId), "Sensor does not exist");
        require(earnedDate > 0, "Invalid earned date");
        require(lastRewardDate[sensorId] < earnedDate, "Reward already calculated for this date");
        
        // Get sensor metadata
        SensorNFA.SensorMetadata memory sensor = sensorNFA.getSensorMetadata(sensorId);
        require(sensor.isActive, "Sensor not active");
        require(sensor.reputationScore >= minReputationForReward, "Reputation too low for rewards");
        
        // Calculate reward components using confidential computation
        RewardCalculation memory calc = _calculateRewardComponents(
            sensor.reputationScore,
            validSubmissions,
            qualityScore
        );
        
        // Create reward claim
        RewardClaim memory claim = RewardClaim({
            sensorId: sensorId,
            amount: calc.totalReward,
            earnedDate: earnedDate,
            claimableAfter: block.timestamp + rewardLockupPeriod,
            claimed: false,
            calculation: calc
        });
        
        // Store reward claim
        sensorRewards[sensorId][earnedDate] = claim;
        lastRewardDate[sensorId] = earnedDate;
        
        // Update daily submission count
        dailySubmissions[sensorId][earnedDate] = validSubmissions;
        
        // Update total earned for sensor owner
        address owner = sensorNFA.ownerOf(sensorNFA.sensorIdToTokenId(sensorId));
        totalEarned[owner] += calc.totalReward;
        
        emit RewardCalculated(sensorId, earnedDate, calc.totalReward, owner);
    }
    
    /**
     * @dev Process rewards for multiple sensors in batch (only authorized ROFL)
     * @param sensorIds Array of sensor identifiers
     * @param earnedDate Date for which rewards are calculated
     * @param validSubmissionCounts Array of valid submission counts
     * @param qualityScores Array of quality scores
     */
    function batchCalculateRewards(
        string[] calldata sensorIds,
        uint256 earnedDate,
        uint256[] calldata validSubmissionCounts,
        uint256[] calldata qualityScores
    ) external onlyAuthorizedROFL {
        require(
            sensorIds.length == validSubmissionCounts.length &&
            validSubmissionCounts.length == qualityScores.length,
            "Array length mismatch"
        );
        
        uint256 totalDistributed = 0;
        uint256 processedCount = 0;
        
        for (uint256 i = 0; i < sensorIds.length; i++) {
            try this.calculateReward(
                sensorIds[i],
                earnedDate,
                validSubmissionCounts[i],
                qualityScores[i]
            ) {
                totalDistributed += sensorRewards[sensorIds[i]][earnedDate].amount;
                processedCount++;
            } catch {
                // Continue processing other sensors
            }
        }
        
        emit BatchRewardsProcessed(processedCount, totalDistributed, block.timestamp);
    }
    
    /**
     * @dev Claim available rewards for a sensor
     * @param sensorId Sensor identifier
     * @param earnedDate Date of the reward to claim
     */
    function claimReward(string calldata sensorId, uint256 earnedDate) external nonReentrant {
        RewardClaim storage claim = sensorRewards[sensorId][earnedDate];
        
        require(claim.amount > 0, "No reward available");
        require(!claim.claimed, "Reward already claimed");
        require(block.timestamp >= claim.claimableAfter, "Reward still locked");
        
        // Verify ownership
        uint256 tokenId = sensorNFA.sensorIdToTokenId(sensorId);
        require(sensorNFA.ownerOf(tokenId) == msg.sender, "Not sensor owner");
        
        // Mark as claimed
        claim.claimed = true;
        totalClaimed[msg.sender] += claim.amount;
        
        // Transfer ROSE (native token transfer)
        require(address(this).balance >= claim.amount, "Insufficient contract balance");
        payable(msg.sender).transfer(claim.amount);
        
        emit RewardClaimed(sensorId, msg.sender, claim.amount, earnedDate);
    }
    
    /**
     * @dev Claim multiple rewards in batch
     * @param sensorIds Array of sensor identifiers
     * @param earnedDates Array of earned dates
     */
    function batchClaimRewards(
        string[] calldata sensorIds,
        uint256[] calldata earnedDates
    ) external nonReentrant {
        require(sensorIds.length == earnedDates.length, "Array length mismatch");
        
        uint256 totalClaimAmount = 0;
        
        for (uint256 i = 0; i < sensorIds.length; i++) {
            RewardClaim storage claim = sensorRewards[sensorIds[i]][earnedDates[i]];
            
            if (claim.amount > 0 && !claim.claimed && block.timestamp >= claim.claimableAfter) {
                uint256 tokenId = sensorNFA.sensorIdToTokenId(sensorIds[i]);
                if (sensorNFA.ownerOf(tokenId) == msg.sender) {
                    claim.claimed = true;
                    totalClaimAmount += claim.amount;
                    
                    emit RewardClaimed(sensorIds[i], msg.sender, claim.amount, earnedDates[i]);
                }
            }
        }
        
        require(totalClaimAmount > 0, "No rewards to claim");
        require(address(this).balance >= totalClaimAmount, "Insufficient contract balance");
        
        totalClaimed[msg.sender] += totalClaimAmount;
        payable(msg.sender).transfer(totalClaimAmount);
    }
    
    /**
     * @dev Get claimable rewards for a user
     * @param user User address
     */
    function getClaimableRewards(address user) external view returns (
        string[] memory sensorIds,
        uint256[] memory earnedDates,
        uint256[] memory amounts
    ) {
        // Get user's sensors
        string[] memory userSensors = sensorNFA.getSensorsByOwner(user);
        
        // Count claimable rewards
        uint256 claimableCount = 0;
        for (uint256 i = 0; i < userSensors.length; i++) {
            uint256 lastDate = lastRewardDate[userSensors[i]];
            // Simplified - in production, you'd iterate through all earned dates
            if (lastDate > 0) {
                RewardClaim memory claim = sensorRewards[userSensors[i]][lastDate];
                if (!claim.claimed && block.timestamp >= claim.claimableAfter) {
                    claimableCount++;
                }
            }
        }
        
        // Populate arrays
        sensorIds = new string[](claimableCount);
        earnedDates = new uint256[](claimableCount);
        amounts = new uint256[](claimableCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < userSensors.length && index < claimableCount; i++) {
            uint256 lastDate = lastRewardDate[userSensors[i]];
            if (lastDate > 0) {
                RewardClaim memory claim = sensorRewards[userSensors[i]][lastDate];
                if (!claim.claimed && block.timestamp >= claim.claimableAfter) {
                    sensorIds[index] = userSensors[i];
                    earnedDates[index] = lastDate;
                    amounts[index] = claim.amount;
                    index++;
                }
            }
        }
    }
    
    /**
     * @dev Internal function to calculate reward components with confidential computation
     */
    function _calculateRewardComponents(
        uint256 reputationScore,
        uint256 validSubmissions,
        uint256 qualityScore
    ) internal view returns (RewardCalculation memory) {
        // Base reward
        uint256 baseReward = baseRewardAmount;
        
        // Quality multiplier (qualityScore is 0-1000, where 1000 = perfect quality)
        uint256 qualityMultiplier = 1000 + (qualityScore * 500 / 1000); // 1.0x to 1.5x
        
        // Frequency bonus (more submissions = higher bonus)
        uint256 frequencyBonus = validSubmissions > 10 ? 
            baseRewardAmount * 10 / 100 : // 10% bonus for >10 submissions
            validSubmissions * baseRewardAmount / 100; // 1% per submission otherwise
        
        // Reputation bonus (reputation 80+ gets bonus)
        uint256 reputationBonus = 0;
        if (reputationScore >= 80) {
            uint256 reputationMultiplier = 1000 + ((reputationScore - 80) * 1000 / 120); // 1.0x to 2.0x
            if (reputationMultiplier > maxReputationMultiplier) {
                reputationMultiplier = maxReputationMultiplier;
            }
            reputationBonus = baseReward * (reputationMultiplier - 1000) / 1000;
        }
        
        // Calculate total reward
        uint256 qualityAdjustedReward = baseReward * qualityMultiplier / 1000;
        uint256 totalReward = qualityAdjustedReward + frequencyBonus + reputationBonus;
        
        return RewardCalculation({
            baseReward: baseReward,
            qualityMultiplier: qualityMultiplier,
            frequencyBonus: frequencyBonus,
            reputationBonus: reputationBonus,
            totalReward: totalReward,
            calculationTime: block.timestamp
        });
    }
    
    /**
     * @dev Fund contract with ROSE for reward distribution (only owner)
     */
    function fundRewards() external payable onlyOwner {
        require(msg.value > 0, "Must send ROSE to fund rewards");
    }
    
    /**
     * @dev Withdraw excess ROSE (only owner)
     */
    function withdrawExcess(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
    
    /**
     * @dev Get contract ROSE balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Receive function to accept ROSE deposits
     */
    receive() external payable {}
}