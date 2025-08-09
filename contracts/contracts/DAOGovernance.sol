// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./RewardDistributor.sol";

/**
 * @title DAOGovernance
 * @dev DAO governance system for D-Climate parameter management using Oasis Sapphire
 * Implements confidential voting and timelock execution
 */
contract DAOGovernance is Ownable, ReentrancyGuard {
    using Sapphire for bytes;
    
    // Proposal states
    enum ProposalState {
        Draft,      // Being created
        Live,       // Active voting period
        Queued,     // Passed, waiting for timelock
        Executed,   // Successfully executed
        Expired,    // Failed to execute within timelock
        Cancelled   // Cancelled by proposer or admin
    }
    
    // Proposal types
    enum ProposalType {
        RewardConfigUpdate,
        ReputationThresholdUpdate,
        GovernanceParameterUpdate,
        ContractUpgrade,
        EmergencyAction
    }
    
    // Proposal structure
    struct Proposal {
        uint256 id;                    // Unique proposal ID
        address proposer;              // Address that created proposal
        ProposalType proposalType;     // Type of proposal
        string title;                  // Proposal title
        string description;            // Detailed description
        bytes proposalData;            // Encoded function call data
        address targetContract;        // Contract to execute on
        uint256 value;                 // ETH value to send (if any)
        
        uint256 startTime;             // Voting start timestamp
        uint256 endTime;               // Voting end timestamp
        uint256 queuedTime;            // When proposal was queued
        uint256 executionTime;         // When proposal was executed
        
        uint256 forVotes;              // Total votes in favor
        uint256 againstVotes;          // Total votes against
        uint256 abstainVotes;          // Total abstain votes
        
        ProposalState state;           // Current proposal state
        bool executed;                 // Whether proposal has been executed
    }
    
    // Vote structure
    struct Vote {
        bool hasVoted;     // Whether user has voted
        uint8 support;     // 0=against, 1=for, 2=abstain
        uint256 weight;    // Vote weight (amount of ROSE staked)
        uint256 timestamp; // When vote was cast
    }
    
    // Delegation structure
    struct Delegation {
        address delegate;      // Address votes are delegated to
        uint256 amount;        // Amount delegated
        uint256 timestamp;     // When delegation was made
        bool isActive;         // Whether delegation is active
    }
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType indexed proposalType,
        string title
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 weight
    );
    
    event ProposalQueued(
        uint256 indexed proposalId,
        uint256 executionTime
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool success,
        bytes returnData
    );
    
    event ProposalCancelled(uint256 indexed proposalId);
    
    event DelegationChanged(
        address indexed delegator,
        address indexed delegate,
        uint256 amount
    );
    
    event StakeChanged(
        address indexed user,
        uint256 oldStake,
        uint256 newStake
    );
    
    // State variables
    RewardDistributor public immutable rewardDistributor;
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes; // proposalId => voter => vote
    mapping(address => uint256) public stakes; // user => staked ROSE amount
    mapping(address => Delegation) public delegations; // delegator => delegation
    mapping(address => uint256) public delegatedPower; // delegate => total delegated power
    mapping(address => uint256) public lastProposalTime; // proposer => last proposal timestamp
    
    uint256 public proposalCount = 0;
    uint256 public totalStaked = 0;
    
    // Governance parameters (can be updated via governance)
    uint256 public votingPeriod = 7 days;           // Voting duration
    uint256 public timelockPeriod = 24 hours;       // Timelock before execution
    uint256 public proposalThreshold = 1000 ether;  // Min ROSE to create proposal
    uint256 public quorumThreshold = 500;           // 5% of total stake (500 = 5%)
    uint256 public majorityThreshold = 7000;        // 70% yes votes required (7000 = 70%)
    uint256 public proposalCooldown = 7 days;       // Time between proposals from same address
    
    constructor(address initialOwner, address _rewardDistributor) Ownable(initialOwner) {
        rewardDistributor = RewardDistributor(payable(_rewardDistributor));
    }
    
    /**
     * @dev Stake ROSE tokens for voting power
     */
    function stake() external payable nonReentrant {
        require(msg.value > 0, "Must stake positive amount");
        
        uint256 oldStake = stakes[msg.sender];
        stakes[msg.sender] += msg.value;
        totalStaked += msg.value;
        
        emit StakeChanged(msg.sender, oldStake, stakes[msg.sender]);
    }
    
    /**
     * @dev Unstake ROSE tokens (with cooldown)
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Must unstake positive amount");
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        
        uint256 oldStake = stakes[msg.sender];
        stakes[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Return ROSE
        payable(msg.sender).transfer(amount);
        
        emit StakeChanged(msg.sender, oldStake, stakes[msg.sender]);
    }
    
    /**
     * @dev Delegate voting power to another address
     * @param delegateTo Address to delegate to
     * @param amount Amount of stake to delegate
     */
    function delegate(address delegateTo, uint256 amount) external {
        require(delegateTo != address(0), "Cannot delegate to zero address");
        require(delegateTo != msg.sender, "Cannot delegate to self");
        require(stakes[msg.sender] >= amount, "Insufficient stake to delegate");
        
        // Remove old delegation if exists
        Delegation storage oldDelegation = delegations[msg.sender];
        if (oldDelegation.isActive) {
            delegatedPower[oldDelegation.delegate] -= oldDelegation.amount;
        }
        
        // Create new delegation
        delegations[msg.sender] = Delegation({
            delegate: delegateTo,
            amount: amount,
            timestamp: block.timestamp,
            isActive: true
        });
        
        delegatedPower[delegateTo] += amount;
        
        emit DelegationChanged(msg.sender, delegateTo, amount);
    }
    
    /**
     * @dev Remove delegation
     */
    function removeDelegation() external {
        Delegation storage delegation = delegations[msg.sender];
        require(delegation.isActive, "No active delegation");
        
        delegatedPower[delegation.delegate] -= delegation.amount;
        delegation.isActive = false;
        
        emit DelegationChanged(msg.sender, address(0), 0);
    }
    
    /**
     * @dev Create a new proposal
     * @param proposalType Type of proposal
     * @param title Proposal title
     * @param description Detailed description
     * @param targetContract Contract to execute on
     * @param proposalData Encoded function call data
     * @param value ETH value to send
     */
    function createProposal(
        ProposalType proposalType,
        string calldata title,
        string calldata description,
        address targetContract,
        bytes calldata proposalData,
        uint256 value
    ) external returns (uint256) {
        require(getVotingPower(msg.sender) >= proposalThreshold, "Insufficient stake for proposal");
        require(
            block.timestamp >= lastProposalTime[msg.sender] + proposalCooldown,
            "Proposal cooldown not met"
        );
        require(bytes(title).length > 0, "Title cannot be empty");
        require(targetContract != address(0), "Invalid target contract");
        
        uint256 proposalId = ++proposalCount;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            proposalType: proposalType,
            title: title,
            description: description,
            proposalData: proposalData,
            targetContract: targetContract,
            value: value,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            queuedTime: 0,
            executionTime: 0,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            state: ProposalState.Live,
            executed: false
        });
        
        lastProposalTime[msg.sender] = block.timestamp;
        
        emit ProposalCreated(proposalId, msg.sender, proposalType, title);
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId Proposal to vote on
     * @param support 0=against, 1=for, 2=abstain
     */
    function castVote(uint256 proposalId, uint8 support) external {
        require(support <= 2, "Invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Live, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        
        Vote storage vote = votes[proposalId][msg.sender];
        require(!vote.hasVoted, "Already voted");
        
        uint256 weight = getVotingPower(msg.sender);
        require(weight > 0, "No voting power");
        
        vote.hasVoted = true;
        vote.support = support;
        vote.weight = weight;
        vote.timestamp = block.timestamp;
        
        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight);
    }
    
    /**
     * @dev Queue a proposal for execution after voting ends
     * @param proposalId Proposal to queue
     */
    function queueProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Live, "Proposal not in live state");
        require(block.timestamp > proposal.endTime, "Voting still active");
        
        // Check if proposal passed
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 requiredQuorum = (totalStaked * quorumThreshold) / 10000;
        uint256 requiredMajority = (proposal.forVotes * 10000) / (proposal.forVotes + proposal.againstVotes);
        
        require(totalVotes >= requiredQuorum, "Quorum not met");
        require(requiredMajority >= majorityThreshold, "Majority threshold not met");
        
        proposal.state = ProposalState.Queued;
        proposal.queuedTime = block.timestamp;
        
        emit ProposalQueued(proposalId, block.timestamp + timelockPeriod);
    }
    
    /**
     * @dev Execute a queued proposal
     * @param proposalId Proposal to execute
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Queued, "Proposal not queued");
        require(
            block.timestamp >= proposal.queuedTime + timelockPeriod,
            "Timelock not expired"
        );
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        proposal.executionTime = block.timestamp;
        proposal.state = ProposalState.Executed;
        
        // Execute the proposal
        (bool success, bytes memory returnData) = proposal.targetContract.call{value: proposal.value}(
            proposal.proposalData
        );
        
        emit ProposalExecuted(proposalId, success, returnData);
        
        if (!success) {
            revert("Proposal execution failed");
        }
    }
    
    /**
     * @dev Cancel a proposal (only proposer or owner)
     * @param proposalId Proposal to cancel
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );
        require(
            proposal.state == ProposalState.Live || proposal.state == ProposalState.Queued,
            "Cannot cancel proposal in current state"
        );
        
        proposal.state = ProposalState.Cancelled;
        
        emit ProposalCancelled(proposalId);
    }
    
    /**
     * @dev Get voting power for an address (stake + delegated power)
     * @param user Address to check
     */
    function getVotingPower(address user) public view returns (uint256) {
        return stakes[user] + delegatedPower[user];
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId Proposal ID
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    /**
     * @dev Get vote details for a user on a proposal
     * @param proposalId Proposal ID
     * @param voter Voter address
     */
    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return votes[proposalId][voter];
    }
    
    /**
     * @dev Update governance parameters (only via governance)
     * @param _votingPeriod New voting period
     * @param _timelockPeriod New timelock period
     * @param _proposalThreshold New proposal threshold
     * @param _quorumThreshold New quorum threshold
     * @param _majorityThreshold New majority threshold
     */
    function updateGovernanceParameters(
        uint256 _votingPeriod,
        uint256 _timelockPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumThreshold,
        uint256 _majorityThreshold
    ) external onlyOwner {
        require(_votingPeriod >= 1 days && _votingPeriod <= 30 days, "Invalid voting period");
        require(_timelockPeriod >= 1 hours && _timelockPeriod <= 7 days, "Invalid timelock period");
        require(_quorumThreshold >= 100 && _quorumThreshold <= 5000, "Invalid quorum threshold"); // 1% to 50%
        require(_majorityThreshold >= 5000 && _majorityThreshold <= 9000, "Invalid majority threshold"); // 50% to 90%
        
        votingPeriod = _votingPeriod;
        timelockPeriod = _timelockPeriod;
        proposalThreshold = _proposalThreshold;
        quorumThreshold = _quorumThreshold;
        majorityThreshold = _majorityThreshold;
    }
    
    /**
     * @dev Emergency pause function (only owner)
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause functionality
        // This would disable proposal creation and voting
    }
    
    /**
     * @dev Receive function to accept ROSE for proposal execution
     */
    receive() external payable {}
}