import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAddress: string;
  type: 'config' | 'parameter' | 'treasury' | 'general';
  status: 'active' | 'passed' | 'rejected' | 'expired';
  createdAt: number;
  expiresAt: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  requiredQuorum: number;
  passingThreshold: number; // Percentage needed to pass (e.g., 0.5 = 50%)
  configChanges?: ConfigChange[];
  voters: string[];
  voteBreakdown: {
    [address: string]: {
      choice: 'for' | 'against' | 'abstain';
      votingPower: number;
      timestamp: number;
      signature?: string;
    };
  };
}

export interface ConfigChange {
  parameter: string;
  currentValue: any;
  proposedValue: any;
  category: 'rewards' | 'regions' | 'sensors' | 'reputation' | 'roles';
  description: string;
}

export interface StakeInfo {
  address: string;
  amount: number;
  stakedAt: number;
  votingPower: number;
  canCreateProposals: boolean;
}

export interface Vote {
  proposalId: string;
  voter: string;
  choice: 'for' | 'against' | 'abstain';
  votingPower: number;
  timestamp: number;
  signature?: string;
}

export interface DAOConfig {
  // Access control
  minStakeForAccess: number;
  minStakeForProposal: number;
  
  // Proposal settings
  proposalDurationMin: number; // 24 hours
  proposalDurationMax: number; // 72 hours
  defaultProposalDuration: number; // 48 hours
  quorumThreshold: number; // Percentage of total voting power needed
  passingThreshold: number; // Percentage of votes needed to pass
  votingDelay: number;
  executionDelay: number;
  
  // Reward rates
  stakingAPY: number;
  validatorReward: number;
  dataProviderReward: number;
  
  // Region weights
  regionWeights: {
    [region: string]: number;
  };
  
  // Sensor management
  bannedSensors: string[];
  sensorReputationThreshold: number;
  
  // Reputation rules
  reputationDecayRate: number;
  reputationBoostMultiplier: number;
  minReputationForRewards: number;
  
  // DAO roles
  roles: {
    admin: string[];
    moderator: string[];
    validator: string[];
  };
}

// Mock proposals for demonstration
const createMockProposals = (): Proposal[] => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const twoDays = 48 * 60 * 60 * 1000;
  const threeDays = 72 * 60 * 60 * 1000;

  return [
    {
      id: 'prop_1_climate_rewards',
      title: 'Increase Climate Data Provider Rewards',
      description: 'This proposal aims to increase the reward rate for climate data providers from 2.5% to 4.0% to incentivize more high-quality data submissions. The increase will help attract more sensors in underrepresented regions and improve data coverage globally. This change is crucial for expanding our network reach and ensuring comprehensive climate monitoring across all continents.',
      author: 'ClimateDAO Foundation',
      authorAddress: 'mock_foundation_addr',
      type: 'config',
      status: 'active',
      createdAt: now - (oneDay * 2),
      expiresAt: now + oneDay,
      votesFor: 245,
      votesAgainst: 89,
      votesAbstain: 34,
      totalVotes: 368,
      requiredQuorum: 0.1,
      passingThreshold: 0.5,
      voters: ['mock_voter_1', 'mock_voter_2', 'mock_voter_3'],
      voteBreakdown: {
        'mock_voter_1': {
          choice: 'for',
          votingPower: 125,
          timestamp: now - oneDay,
          signature: 'sig_mock_1'
        },
        'mock_voter_2': {
          choice: 'for',
          votingPower: 120,
          timestamp: now - (oneDay / 2),
          signature: 'sig_mock_2'
        },
        'mock_voter_3': {
          choice: 'against',
          votingPower: 89,
          timestamp: now - (oneDay / 3),
          signature: 'sig_mock_3'
        }
      },
      configChanges: [
        {
          parameter: 'dataProviderReward',
          currentValue: '2.5%',
          proposedValue: '4.0%',
          category: 'rewards',
          description: 'Increase reward rate to attract more data providers in underrepresented regions'
        }
      ]
    },
    {
      id: 'prop_2_africa_multiplier',
      title: 'Boost Africa Region Weight Multiplier',
      description: 'Proposal to increase the Africa region weight multiplier from 1.5x to 2.0x to encourage more sensor deployment in African countries. This region is critically underrepresented in global climate monitoring, and higher incentives will help bridge this gap. The increased multiplier will provide better compensation for the challenges of operating sensors in this region.',
      author: 'African Climate Initiative',
      authorAddress: 'mock_africa_addr',
      type: 'config',
      status: 'active',
      createdAt: now - oneDay,
      expiresAt: now + twoDays,
      votesFor: 156,
      votesAgainst: 45,
      votesAbstain: 23,
      totalVotes: 224,
      requiredQuorum: 0.1,
      passingThreshold: 0.5,
      voters: ['mock_voter_4', 'mock_voter_5'],
      voteBreakdown: {
        'mock_voter_4': {
          choice: 'for',
          votingPower: 156,
          timestamp: now - (oneDay / 2),
          signature: 'sig_mock_4'
        },
        'mock_voter_5': {
          choice: 'against',
          votingPower: 45,
          timestamp: now - (oneDay / 4),
          signature: 'sig_mock_5'
        }
      },
      configChanges: [
        {
          parameter: 'regionWeights.africa',
          currentValue: '1.5x',
          proposedValue: '2.0x',
          category: 'regions',
          description: 'Increase incentives for African sensor deployment to improve regional coverage'
        }
      ]
    },
    {
      id: 'prop_3_treasury_research',
      title: 'Allocate Treasury Funds for Climate Research',
      description: 'This proposal requests allocation of 50,000 ROSE from the DAO treasury to fund independent climate research initiatives. The funds will be distributed to universities and research institutions working on climate modeling, data analysis, and sensor technology improvements. This investment will directly benefit our network by advancing the science behind climate monitoring.',
      author: 'Research Committee',
      authorAddress: 'mock_research_addr',
      type: 'treasury',
      status: 'active',
      createdAt: now - (oneDay / 2),
      expiresAt: now + threeDays,
      votesFor: 89,
      votesAgainst: 156,
      votesAbstain: 67,
      totalVotes: 312,
      requiredQuorum: 0.1,
      passingThreshold: 0.5,
      voters: ['mock_voter_6', 'mock_voter_7', 'mock_voter_8'],
      voteBreakdown: {
        'mock_voter_6': {
          choice: 'against',
          votingPower: 156,
          timestamp: now - (oneDay / 4),
          signature: 'sig_mock_6'
        },
        'mock_voter_7': {
          choice: 'for',
          votingPower: 89,
          timestamp: now - (oneDay / 6),
          signature: 'sig_mock_7'
        },
        'mock_voter_8': {
          choice: 'abstain',
          votingPower: 67,
          timestamp: now - (oneDay / 8),
          signature: 'sig_mock_8'
        }
      }
    },
    {
      id: 'prop_4_staking_apy',
      title: 'Reduce Staking APY to Sustainable Levels',
      description: 'Proposal to reduce the current staking APY from 12.5% to 8.5% to ensure long-term sustainability of the reward system. While this reduction may seem significant, it aligns with market standards and ensures the DAO can maintain rewards over the long term without depleting reserves. The saved funds will be redirected to data provider incentives.',
      author: 'Economic Council',
      authorAddress: 'mock_economic_addr',
      type: 'config',
      status: 'passed',
      createdAt: now - (oneDay * 5),
      expiresAt: now - oneDay,
      votesFor: 445,
      votesAgainst: 234,
      votesAbstain: 89,
      totalVotes: 768,
      requiredQuorum: 0.1,
      passingThreshold: 0.5,
      voters: ['mock_voter_9', 'mock_voter_10', 'mock_voter_11'],
      voteBreakdown: {
        'mock_voter_9': {
          choice: 'for',
          votingPower: 445,
          timestamp: now - (oneDay * 2),
          signature: 'sig_mock_9'
        },
        'mock_voter_10': {
          choice: 'against',
          votingPower: 234,
          timestamp: now - (oneDay * 2),
          signature: 'sig_mock_10'
        },
        'mock_voter_11': {
          choice: 'abstain',
          votingPower: 89,
          timestamp: now - (oneDay * 2),
          signature: 'sig_mock_11'
        }
      },
      configChanges: [
        {
          parameter: 'stakingAPY',
          currentValue: '12.5%',
          proposedValue: '8.5%',
          category: 'rewards',
          description: 'Reduce APY to sustainable levels and redirect funds to data provider incentives'
        }
      ]
    },
    {
      id: 'prop_5_sensor_reputation',
      title: 'Lower Sensor Reputation Threshold',
      description: 'This proposal suggests lowering the sensor reputation threshold from 0.7 to 0.6 to allow more sensors to participate in the network while maintaining quality standards. The current threshold may be too restrictive and preventing good sensors from contributing. A slight reduction will increase network participation while still filtering out unreliable sensors.',
      author: 'Sensor Network Team',
      authorAddress: 'mock_sensor_addr',
      type: 'config',
      status: 'rejected',
      createdAt: now - (oneDay * 7),
      expiresAt: now - (oneDay * 3),
      votesFor: 123,
      votesAgainst: 456,
      votesAbstain: 78,
      totalVotes: 657,
      requiredQuorum: 0.1,
      passingThreshold: 0.5,
      voters: ['mock_voter_12', 'mock_voter_13'],
      voteBreakdown: {
        'mock_voter_12': {
          choice: 'against',
          votingPower: 456,
          timestamp: now - (oneDay * 4),
          signature: 'sig_mock_12'
        },
        'mock_voter_13': {
          choice: 'for',
          votingPower: 123,
          timestamp: now - (oneDay * 4),
          signature: 'sig_mock_13'
        }
      },
      configChanges: [
        {
          parameter: 'sensorReputationThreshold',
          currentValue: '0.7',
          proposedValue: '0.6',
          category: 'sensors',
          description: 'Lower threshold to increase network participation while maintaining quality'
        }
      ]
    },
    {
      id: 'prop_6_governance_upgrade',
      title: 'Implement Quadratic Voting System',
      description: 'Revolutionary proposal to implement quadratic voting to give smaller stakeholders more influence in governance decisions. Under this system, voting power would be calculated as the square root of staked tokens, reducing the dominance of large stakeholders and promoting more democratic decision-making. This change would require significant technical implementation but could greatly improve governance fairness.',
      author: 'Governance Innovation Lab',
      authorAddress: 'mock_innovation_addr',
      type: 'general',
      status: 'active',
      createdAt: now - (oneDay * 3),
      expiresAt: now + (oneDay * 2),
      votesFor: 234,
      votesAgainst: 345,
      votesAbstain: 123,
      totalVotes: 702,
      requiredQuorum: 0.1,
      passingThreshold: 0.5,
      voters: ['mock_voter_14', 'mock_voter_15', 'mock_voter_16'],
      voteBreakdown: {
        'mock_voter_14': {
          choice: 'for',
          votingPower: 234,
          timestamp: now - oneDay,
          signature: 'sig_mock_14'
        },
        'mock_voter_15': {
          choice: 'against',
          votingPower: 345,
          timestamp: now - oneDay,
          signature: 'sig_mock_15'
        },
        'mock_voter_16': {
          choice: 'abstain',
          votingPower: 123,
          timestamp: now - (oneDay / 2),
          signature: 'sig_mock_16'
        }
      }
    }
  ];
};

interface DAOState {
  // Staking
  userStake: StakeInfo | null;
  totalStaked: number;
  totalVotingPower: number;
  
  // Proposals
  proposals: Proposal[];
  activeProposals: Proposal[];
  userVotes: Vote[];
  selectedProposal: Proposal | null;
  
  // Configuration
  daoConfig: DAOConfig;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  checkStakingStatus: (address: string) => Promise<void>;
  stakeROSE: (amount: number) => Promise<void>;
  unstakeROSE: (amount: number) => Promise<void>;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'votesFor' | 'votesAgainst' | 'votesAbstain' | 'totalVotes' | 'voters' | 'voteBreakdown'>) => Promise<string>;
  createConfigProposal: (title: string, description: string, configChanges: ConfigChange[], duration?: number) => Promise<string>;
  voteOnProposal: (proposalId: string, choice: 'for' | 'against' | 'abstain', signature?: string) => Promise<void>;
  getProposals: () => Promise<void>;
  getProposal: (proposalId: string) => Promise<Proposal | null>;
  getVotingPower: (address: string) => Promise<number>;
  hasDAOAccess: (address: string) => Promise<boolean>;
  updateDAOConfig: (newConfig: Partial<DAOConfig>) => Promise<void>;
  setSelectedProposal: (proposal: Proposal | null) => void;
  initializeMockProposals: () => void;
}

export const useDAOStore = create<DAOState>()(
  persist(
    (set, get) => ({
      // Initial state
      userStake: null,
      totalStaked: 1000, // Mock total staked amount
      totalVotingPower: 1000,
      proposals: [],
      activeProposals: [],
      userVotes: [],
      selectedProposal: null,
      daoConfig: {
        // Access control
        minStakeForAccess: 10,
        minStakeForProposal: 50,
        
        // Proposal settings
        proposalDurationMin: 24 * 60 * 60 * 1000, // 24 hours
        proposalDurationMax: 72 * 60 * 60 * 1000, // 72 hours
        defaultProposalDuration: 48 * 60 * 60 * 1000, // 48 hours
        quorumThreshold: 0.1, // 10% of total voting power
        passingThreshold: 0.5, // 50% of votes cast
        votingDelay: 1 * 60 * 60 * 1000, // 1 hour
        executionDelay: 24 * 60 * 60 * 1000, // 24 hours
        
        // Reward rates
        stakingAPY: 12.5,
        validatorReward: 5.0,
        dataProviderReward: 2.5,
        
        // Region weights
        regionWeights: {
          'north-america': 1.0,
          'europe': 1.0,
          'asia-pacific': 1.2,
          'africa': 1.5,
          'south-america': 1.3,
          'oceania': 1.1
        },
        
        // Sensor management
        bannedSensors: [],
        sensorReputationThreshold: 0.7,
        
        // Reputation rules
        reputationDecayRate: 0.01,
        reputationBoostMultiplier: 1.5,
        minReputationForRewards: 0.5,
        
        // DAO roles
        roles: {
          admin: [],
          moderator: [],
          validator: []
        }
      },
      isLoading: false,
      error: null,

      initializeMockProposals: () => {
        const existingProposals = localStorage.getItem('dao_proposals');
        if (!existingProposals || JSON.parse(existingProposals).length === 0) {
          const mockProposals = createMockProposals();
          localStorage.setItem('dao_proposals', JSON.stringify(mockProposals));
          set({ 
            proposals: mockProposals,
            activeProposals: mockProposals.filter(p => p.status === 'active')
          });
          console.log('✅ Initialized mock proposals:', mockProposals.length);
        }
      },

      checkStakingStatus: async (address: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const mockStake = localStorage.getItem(`dao_stake_${address}`);
          
          if (mockStake) {
            const stakeData = JSON.parse(mockStake);
            console.log('✅ Loaded stake data:', stakeData);
            set({ userStake: stakeData });
          } else {
            console.log('❌ No stake data found for address:', address);
            set({ userStake: null });
          }
        } catch (error) {
          console.error('❌ Failed to check staking status:', error);
          set({ error: 'Failed to check staking status' });
        } finally {
          set({ isLoading: false });
        }
      },

      stakeROSE: async (amount: number) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get current user stake or create new one
          const currentStake = get().userStake;
          const address = currentStake?.address || `mock_address_${Date.now()}`;
          const currentAmount = currentStake?.amount || 0;
          
          const newStake: StakeInfo = {
            address,
            amount: currentAmount + amount,
            stakedAt: Date.now(),
            votingPower: currentAmount + amount,
            canCreateProposals: (currentAmount + amount) >= get().daoConfig.minStakeForProposal
          };
          
          // Save to localStorage
          localStorage.setItem(`dao_stake_${address}`, JSON.stringify(newStake));
          
          // Update state
          set({ userStake: newStake });
          
          console.log(`✅ Successfully staked ${amount} ROSE. Total: ${newStake.amount} ROSE`);
          console.log('✅ New stake data:', newStake);
          
        } catch (error) {
          console.error('❌ Staking failed:', error);
          set({ error: 'Failed to stake ROSE' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      unstakeROSE: async (amount: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentStake = get().userStake;
          if (!currentStake || currentStake.amount < amount) {
            throw new Error('Insufficient stake amount');
          }
          
          const newAmount = currentStake.amount - amount;
          const updatedStake: StakeInfo = {
            ...currentStake,
            amount: newAmount,
            votingPower: newAmount,
            canCreateProposals: newAmount >= get().daoConfig.minStakeForProposal
          };
          
          if (newAmount === 0) {
            localStorage.removeItem(`dao_stake_${currentStake.address}`);
            set({ userStake: null });
          } else {
            localStorage.setItem(`dao_stake_${currentStake.address}`, JSON.stringify(updatedStake));
            set({ userStake: updatedStake });
          }
          
          console.log(`✅ Unstaked ${amount} ROSE successfully`);
        } catch (error) {
          set({ error: 'Failed to unstake ROSE' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      createProposal: async (proposalData) => {
        set({ isLoading: true, error: null });
        
        try {
          const userStake = get().userStake;
          if (!userStake || !userStake.canCreateProposals) {
            throw new Error('Insufficient stake to create proposals');
          }
          
          const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const now = Date.now();
          const duration = proposalData.expiresAt - now || get().daoConfig.defaultProposalDuration;
          
          const proposal: Proposal = {
            ...proposalData,
            id: proposalId,
            createdAt: now,
            expiresAt: now + duration,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            totalVotes: 0,
            voters: [],
            voteBreakdown: {}
          };
          
          const currentProposals = get().proposals;
          const updatedProposals = [...currentProposals, proposal];
          
          localStorage.setItem('dao_proposals', JSON.stringify(updatedProposals));
          set({ 
            proposals: updatedProposals,
            activeProposals: updatedProposals.filter(p => p.status === 'active')
          });
          
          console.log(`✅ Proposal created: ${proposalId}`);
          return proposalId;
        } catch (error) {
          set({ error: 'Failed to create proposal' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      createConfigProposal: async (title: string, description: string, configChanges: ConfigChange[], duration?: number) => {
        const proposalDuration = duration || get().daoConfig.defaultProposalDuration;
        
        return get().createProposal({
          title,
          description,
          author: get().userStake?.address || 'Unknown',
          authorAddress: get().userStake?.address || '',
          type: 'config',
          status: 'active',
          expiresAt: Date.now() + proposalDuration,
          requiredQuorum: get().daoConfig.quorumThreshold,
          passingThreshold: get().daoConfig.passingThreshold,
          configChanges
        });
      },

      voteOnProposal: async (proposalId: string, choice: 'for' | 'against' | 'abstain', signature?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const userStake = get().userStake;
          if (!userStake) {
            throw new Error('Must be staked to vote');
          }
          
          const proposals = get().proposals;
          const proposalIndex = proposals.findIndex(p => p.id === proposalId);
          
          if (proposalIndex === -1) {
            throw new Error('Proposal not found');
          }
          
          const proposal = proposals[proposalIndex];
          
          if (proposal.voters.includes(userStake.address)) {
            throw new Error('Already voted on this proposal');
          }
          
          if (proposal.status !== 'active' || Date.now() > proposal.expiresAt) {
            throw new Error('Proposal is not active');
          }
          
          // Create vote record
          const vote: Vote = {
            proposalId,
            voter: userStake.address,
            choice,
            votingPower: userStake.votingPower,
            timestamp: Date.now(),
            signature
          };
          
          // Update proposal
          const updatedProposal = {
            ...proposal,
            votesFor: choice === 'for' ? proposal.votesFor + userStake.votingPower : proposal.votesFor,
            votesAgainst: choice === 'against' ? proposal.votesAgainst + userStake.votingPower : proposal.votesAgainst,
            votesAbstain: choice === 'abstain' ? proposal.votesAbstain + userStake.votingPower : proposal.votesAbstain,
            totalVotes: proposal.totalVotes + userStake.votingPower,
            voters: [...proposal.voters, userStake.address],
            voteBreakdown: {
              ...proposal.voteBreakdown,
              [userStake.address]: {
                choice,
                votingPower: userStake.votingPower,
                timestamp: Date.now(),
                signature
              }
            }
          };
          
          const updatedProposals = [...proposals];
          updatedProposals[proposalIndex] = updatedProposal;
          
          const userVotes = [...get().userVotes, vote];
          
          localStorage.setItem('dao_proposals', JSON.stringify(updatedProposals));
          localStorage.setItem(`dao_votes_${userStake.address}`, JSON.stringify(userVotes));
          
          set({ 
            proposals: updatedProposals,
            activeProposals: updatedProposals.filter(p => p.status === 'active'),
            userVotes
          });
          
          console.log(`✅ Voted ${choice} on proposal ${proposalId}`);
        } catch (error) {
          set({ error: 'Failed to vote on proposal' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getProposals: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Initialize mock proposals if none exist
          get().initializeMockProposals();
          
          const storedProposals = localStorage.getItem('dao_proposals');
          const proposals = storedProposals ? JSON.parse(storedProposals) : [];
          
          // Update proposal statuses based on time and votes
          const now = Date.now();
          const { totalVotingPower, daoConfig } = get();
          
          const updatedProposals = proposals.map((proposal: Proposal) => {
            if (proposal.status === 'active' && now > proposal.expiresAt) {
              const quorumMet = proposal.totalVotes >= (totalVotingPower * daoConfig.quorumThreshold);
              const votesNeeded = proposal.totalVotes * proposal.passingThreshold;
              const passed = quorumMet && proposal.votesFor > votesNeeded;
              
              return {
                ...proposal,
                status: passed ? 'passed' : (quorumMet ? 'rejected' : 'expired')
              };
            }
            return proposal;
          });
          
          localStorage.setItem('dao_proposals', JSON.stringify(updatedProposals));
          
          set({ 
            proposals: updatedProposals,
            activeProposals: updatedProposals.filter((p: Proposal) => p.status === 'active')
          });
        } catch (error) {
          set({ error: 'Failed to load proposals' });
        } finally {
          set({ isLoading: false });
        }
      },

      getProposal: async (proposalId: string) => {
        const proposals = get().proposals;
        return proposals.find(p => p.id === proposalId) || null;
      },

      getVotingPower: async (address: string) => {
        const stakeData = localStorage.getItem(`dao_stake_${address}`);
        if (stakeData) {
          const stake = JSON.parse(stakeData);
          return stake.votingPower || 0;
        }
        return 0;
      },

      hasDAOAccess: async (address: string) => {
        const votingPower = await get().getVotingPower(address);
        const hasAccess = votingPower >= get().daoConfig.minStakeForAccess;
        console.log('DAO Access Check:', { address, votingPower, required: get().daoConfig.minStakeForAccess, hasAccess });
        return hasAccess;
      },

      updateDAOConfig: async (newConfig: Partial<DAOConfig>) => {
        set(state => ({
          daoConfig: { ...state.daoConfig, ...newConfig }
        }));
      },

      setSelectedProposal: (proposal: Proposal | null) => {
        set({ selectedProposal: proposal });
      }
    }),
    {
      name: 'dao-storage',
      partialize: (state) => ({
        userStake: state.userStake,
        proposals: state.proposals,
        userVotes: state.userVotes,
        daoConfig: state.daoConfig,
        totalStaked: state.totalStaked,
        totalVotingPower: state.totalVotingPower
      })
    }
  )
);
