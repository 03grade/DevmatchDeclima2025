import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Vote, 
  Users, 
  Clock, 
  TrendingUp, 
  Lock,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Coins,
  BarChart3,
  FileText,
  Calendar,
  User,
  ArrowRight,
  Eye,
  Minus,
  Activity,
  Target,
  Zap,
  Globe,
  Ban,
  Award,
  UserCheck,
  Hash,
  Percent
} from 'lucide-react';
import { useWeb3Store } from '../store/web3Store';
import { useDAOStore, ConfigChange } from '../store/daoStore';

const DAO: React.FC = () => {
  const { isConnected, account } = useWeb3Store();
  const {
    userStake,
    proposals,
    activeProposals,
    daoConfig,
    selectedProposal,
    isLoading,
    error,
    checkStakingStatus,
    stakeROSE,
    unstakeROSE,
    createProposal,
    createConfigProposal,
    voteOnProposal,
    getProposals,
    getProposal,
    hasDAOAccess,
    setSelectedProposal
  } = useDAOStore();

  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'create' | 'config' | 'vote'>('overview');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [accessChecked, setAccessChecked] = useState(false);

  // Debug logging
  console.log('DAO Debug:', {
    isConnected,
    account,
    userStake,
    hasAccess,
    accessChecked,
    minStakeForAccess: daoConfig.minStakeForAccess
  });

  // Check DAO access on load and when account/stake changes
  useEffect(() => {
    const checkAccess = async () => {
      console.log('Checking DAO access...');
      
      if (!account) {
        console.log('No account connected');
        setHasAccess(false);
        setAccessChecked(true);
        return;
      }

      try {
        // First check staking status
        await checkStakingStatus(account);
        
        // Get fresh stake data
        const stakeData = localStorage.getItem(`dao_stake_${account}`);
        console.log('Stake data from localStorage:', stakeData);
        
        if (stakeData) {
          const stake = JSON.parse(stakeData);
          console.log('Parsed stake:', stake);
          
          // Check if stake meets minimum requirement
          const meetsRequirement = stake.amount >= daoConfig.minStakeForAccess;
          console.log('Meets requirement:', meetsRequirement, 'Amount:', stake.amount, 'Required:', daoConfig.minStakeForAccess);
          
          setHasAccess(meetsRequirement);
        } else {
          console.log('No stake data found');
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
      
      setAccessChecked(true);
    };

    checkAccess();
    getProposals();
  }, [account, checkStakingStatus, daoConfig.minStakeForAccess, getProposals]);

  // Force re-check access when userStake changes
  useEffect(() => {
    if (userStake && userStake.amount >= daoConfig.minStakeForAccess) {
      console.log('UserStake updated, granting access:', userStake);
      setHasAccess(true);
    } else if (userStake) {
      console.log('UserStake insufficient:', userStake.amount, 'Required:', daoConfig.minStakeForAccess);
      setHasAccess(false);
    }
  }, [userStake, daoConfig.minStakeForAccess]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    
    try {
      console.log('Staking:', stakeAmount, 'ROSE');
      await stakeROSE(parseFloat(stakeAmount));
      setStakeAmount('');
      
      // Force immediate access check
      setTimeout(async () => {
        if (account) {
          await checkStakingStatus(account);
          const stakeData = localStorage.getItem(`dao_stake_${account}`);
          if (stakeData) {
            const stake = JSON.parse(stakeData);
            const meetsRequirement = stake.amount >= daoConfig.minStakeForAccess;
            console.log('Post-stake access check:', meetsRequirement);
            setHasAccess(meetsRequirement);
          }
        }
      }, 100);
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    
    try {
      await unstakeROSE(parseFloat(unstakeAmount));
      setUnstakeAmount('');
      
      // Force immediate access check
      setTimeout(async () => {
        if (account) {
          await checkStakingStatus(account);
          const stakeData = localStorage.getItem(`dao_stake_${account}`);
          if (stakeData) {
            const stake = JSON.parse(stakeData);
            const meetsRequirement = stake.amount >= daoConfig.minStakeForAccess;
            setHasAccess(meetsRequirement);
          } else {
            setHasAccess(false);
          }
        }
      }, 100);
    } catch (error) {
      console.error('Unstaking failed:', error);
    }
  };

  const handleVote = async (proposalId: string, choice: 'for' | 'against' | 'abstain') => {
    try {
      const signature = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      await voteOnProposal(proposalId, choice, signature);
      
      const updatedProposal = await getProposal(proposalId);
      if (updatedProposal) {
        setSelectedProposal(updatedProposal);
      }
    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  const handleProposalClick = async (proposalId: string) => {
    const proposal = await getProposal(proposalId);
    if (proposal) {
      setSelectedProposal(proposal);
      setActiveTab('vote');
    }
  };

  // Show loading while checking access
  if (!accessChecked) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 border-4 border-custom-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-tech">Checking DAO access...</p>
        </motion.div>
      </div>
    );
  }

  // Gated access screen for non-connected wallets
  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 bg-custom-gradient rounded-full flex items-center justify-center mx-auto cyber-glow">
            <Shield className="w-10 h-10 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-cyber font-bold text-white mb-2">
              WALLET CONNECTION REQUIRED
            </h2>
            <p className="text-gray-400 font-tech">
              Connect your wallet to access DAO governance
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Gated access screen for non-stakers
  if (!hasAccess) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <div className="w-24 h-24 bg-custom-gradient rounded-full flex items-center justify-center mx-auto cyber-glow">
                <Lock className="w-12 h-12 text-black" />
              </div>
              <h1 className="text-3xl font-cyber font-bold holo-text">
                DAO GOVERNANCE ACCESS
              </h1>
              <p className="text-xl text-gray-300 font-tech max-w-2xl mx-auto">
                Governance features are only available to active DAO participants. 
                Stake at least <span className="text-custom-green font-bold">{daoConfig.minStakeForAccess} ROSE</span> to access proposals, voting, and configuration.
              </p>
              
              {/* Debug info */}
              <div className="text-sm text-gray-500 font-tech">
                Current stake: {userStake?.amount || 0} ROSE | Required: {daoConfig.minStakeForAccess} ROSE
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="tech-panel p-8 max-w-md mx-auto"
            >
              <h3 className="text-xl font-cyber font-bold text-custom-green mb-6 flex items-center justify-center space-x-2">
                <Coins className="w-5 h-5" />
                <span>JOIN THE DAO</span>
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Stake Amount (ROSE)
                  </label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder={`Minimum ${daoConfig.minStakeForAccess} ROSE`}
                    min={daoConfig.minStakeForAccess}
                    className="cyber-input w-full"
                  />
                </div>

                <button
                  onClick={handleStake}
                  disabled={!stakeAmount || parseFloat(stakeAmount) < daoConfig.minStakeForAccess || isLoading}
                  className="cyber-btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>STAKE & JOIN DAO</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="text-red-400 text-sm font-tech text-center">
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-tech font-bold text-gray-300 mb-4">DAO MEMBER BENEFITS:</h4>
                <div className="space-y-2 text-sm font-tech text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Vote className="w-4 h-4 text-custom-green" />
                    <span>Vote on governance proposals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-custom-green" />
                    <span>Influence network parameters</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-custom-green" />
                    <span>Create proposals ({daoConfig.minStakeForProposal}+ ROSE)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // MAIN DAO INTERFACE - This should show after staking 10+ ROSE
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-cyber font-bold holo-text mb-2">
              DAO GOVERNANCE
            </h1>
            <p className="text-gray-400 font-tech">
              Decentralized governance for the climate data network
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="text-right">
              <p className="text-sm font-tech text-gray-400">Your Voting Power</p>
              <p className="text-xl font-cyber font-bold text-custom-green">
                {userStake?.votingPower || 0} ROSE
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-tech text-gray-400">Access Status</p>
              <p className="text-sm font-cyber font-bold text-custom-green">
                ✓ VERIFIED
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs - ALL 5 TABS */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'proposals', label: 'Proposals', icon: Vote },
            { id: 'create', label: 'Create', icon: Plus },
            { id: 'config', label: 'Config', icon: Settings },
            ...(selectedProposal ? [{ id: 'vote', label: 'Vote', icon: Eye }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded font-tech transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-custom-gradient text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            userStake={userStake}
            proposals={proposals}
            activeProposals={activeProposals}
            daoConfig={daoConfig}
            account={account}
            stakeAmount={stakeAmount}
            setStakeAmount={setStakeAmount}
            unstakeAmount={unstakeAmount}
            setUnstakeAmount={setUnstakeAmount}
            handleStake={handleStake}
            handleUnstake={handleUnstake}
            isLoading={isLoading}
            onProposalClick={handleProposalClick}
          />
        )}

        {activeTab === 'proposals' && (
          <ProposalsTab 
            proposals={proposals}
            account={account}
            onProposalClick={handleProposalClick}
          />
        )}

        {activeTab === 'create' && (
          <CreateTab 
            userStake={userStake}
            daoConfig={daoConfig}
            onCreateProposal={createProposal}
            onCreateConfigProposal={createConfigProposal}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'config' && (
          <ConfigTab daoConfig={daoConfig} />
        )}

        {activeTab === 'vote' && selectedProposal && (
          <VoteTab 
            proposal={selectedProposal}
            userStake={userStake}
            account={account}
            onVote={handleVote}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<any> = ({ 
  userStake, 
  proposals, 
  activeProposals, 
  daoConfig, 
  account,
  stakeAmount,
  setStakeAmount,
  unstakeAmount,
  setUnstakeAmount,
  handleStake,
  handleUnstake,
  isLoading,
  onProposalClick
}) => (
  <div className="grid lg:grid-cols-3 gap-8">
    {/* Staking Panel */}
    <div className="lg:col-span-1">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="tech-panel p-6 space-y-6"
      >
        <h3 className="text-lg font-cyber font-bold text-custom-green flex items-center space-x-2">
          <Coins className="w-5 h-5" />
          <span>STAKING</span>
        </h3>

        {/* Current Stake */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-tech text-gray-400">Current Stake</span>
            <span className="font-mono text-white">{userStake?.amount || 0} ROSE</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-tech text-gray-400">Voting Power</span>
            <span className="font-mono text-custom-green">{userStake?.votingPower || 0}</span>
          </div>
        </div>

        {/* Stake More */}
        <div className="space-y-3">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Amount to stake"
            className="cyber-input w-full"
          />
          <button
            onClick={handleStake}
            disabled={!stakeAmount || isLoading}
            className="cyber-btn-primary w-full"
          >
            STAKE MORE
          </button>
        </div>

        {/* Unstake */}
        <div className="space-y-3">
          <input
            type="number"
            value={unstakeAmount}
            onChange={(e) => setUnstakeAmount(e.target.value)}
            placeholder="Amount to unstake"
            max={userStake?.amount || 0}
            className="cyber-input w-full"
          />
          <button
            onClick={handleUnstake}
            disabled={!unstakeAmount || isLoading}
            className="cyber-btn-secondary w-full"
          >
            UNSTAKE
          </button>
        </div>
      </motion.div>
    </div>

    {/* Stats & Activity */}
    <div className="lg:col-span-2 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tech-panel p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-tech text-gray-400 mb-1">Active Proposals</p>
              <p className="text-2xl font-cyber font-bold text-white">
                {activeProposals.length}
              </p>
            </div>
            <Vote className="w-8 h-8 text-custom-green" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="tech-panel p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-tech text-gray-400 mb-1">Total Proposals</p>
              <p className="text-2xl font-cyber font-bold text-white">
                {proposals.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-custom-green" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="tech-panel p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-tech text-gray-400 mb-1">Your Votes</p>
              <p className="text-2xl font-cyber font-bold text-white">
                {proposals.filter(p => p.voters.includes(account || '')).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-custom-green" />
          </div>
        </motion.div>
      </div>

      {/* Recent Proposals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="tech-panel p-6"
      >
        <h3 className="text-lg font-cyber font-bold text-custom-green mb-4">
          RECENT PROPOSALS
        </h3>
        
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 font-tech">No proposals yet. Create the first one!</p>
            </div>
          ) : (
            proposals.slice(0, 3).map((proposal) => (
              <div
                key={proposal.id}
                onClick={() => onProposalClick(proposal.id)}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded border border-gray-700 cursor-pointer hover:border-custom-green/50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-tech font-bold text-white mb-1">
                    {proposal.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 font-tech">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{proposal.author}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-tech font-bold ${
                    proposal.status === 'active' ? 'bg-custom-green/20 text-custom-green' :
                    proposal.status === 'passed' ? 'bg-green-500/20 text-green-400' :
                    proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {proposal.status.toUpperCase()}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  </div>
);

// Proposals Tab Component
const ProposalsTab: React.FC<any> = ({ proposals, account, onProposalClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-cyber font-bold text-custom-green">
        ALL PROPOSALS
      </h2>
      <div className="flex space-x-2">
        <button className="cyber-btn-secondary text-sm">
          FILTER
        </button>
        <button className="cyber-btn-secondary text-sm">
          SORT
        </button>
      </div>
    </div>

    <div className="grid gap-6">
      {proposals.length === 0 ? (
        <div className="tech-panel p-12 text-center">
          <Vote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-cyber font-bold text-gray-400 mb-2">No Proposals Yet</h3>
          <p className="text-gray-500 font-tech">Be the first to create a governance proposal!</p>
        </div>
      ) : (
        proposals.map((proposal: any) => (
          <motion.div
            key={proposal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="tech-panel p-6 cursor-pointer hover:border-custom-green/50 transition-colors"
            onClick={() => onProposalClick(proposal.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-tech font-bold text-white">
                    {proposal.title}
                  </h3>
                  <div className={`px-2 py-1 rounded text-xs font-tech font-bold ${
                    proposal.status === 'active' ? 'bg-custom-green/20 text-custom-green' :
                    proposal.status === 'passed' ? 'bg-green-500/20 text-green-400' :
                    proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {proposal.status.toUpperCase()}
                  </div>
                </div>
                
                <p className="text-gray-300 font-tech mb-3 line-clamp-2">
                  {proposal.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-400 font-tech">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{proposal.author}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {proposal.status === 'active' 
                        ? `${Math.ceil((proposal.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                        : `Ended ${new Date(proposal.expiresAt).toLocaleDateString()}`
                      }
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Vote Stats */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm font-tech text-gray-400">For</p>
                <p className="text-lg font-cyber font-bold text-green-400">
                  {proposal.votesFor}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-tech text-gray-400">Against</p>
                <p className="text-lg font-cyber font-bold text-red-400">
                  {proposal.votesAgainst}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-tech text-gray-400">Abstain</p>
                <p className="text-lg font-cyber font-bold text-yellow-400">
                  {proposal.votesAbstain}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-tech text-gray-400">Total</p>
                <p className="text-lg font-cyber font-bold text-white">
                  {proposal.totalVotes}
                </p>
              </div>
            </div>

            {/* Vote Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-tech text-gray-400 mb-1">
                <span>FOR</span>
                <span>AGAINST</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 flex">
                <div 
                  className="bg-green-500 h-2 rounded-l-full"
                  style={{ 
                    width: proposal.totalVotes > 0 
                      ? `${(proposal.votesFor / proposal.totalVotes) * 100}%` 
                      : '0%' 
                  }}
                ></div>
                <div 
                  className="bg-red-500 h-2"
                  style={{ 
                    width: proposal.totalVotes > 0 
                      ? `${(proposal.votesAgainst / proposal.totalVotes) * 100}%` 
                      : '0%' 
                  }}
                ></div>
                <div 
                  className="bg-yellow-500 h-2 rounded-r-full"
                  style={{ 
                    width: proposal.totalVotes > 0 
                      ? `${(proposal.votesAbstain / proposal.totalVotes) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>

            {/* Voting Status */}
            {proposal.voters.includes(account || '') ? (
              <div className="flex items-center space-x-2 text-custom-green font-tech">
                <CheckCircle className="w-4 h-4" />
                <span>You have voted on this proposal</span>
              </div>
            ) : proposal.status === 'active' ? (
              <div className="flex items-center space-x-2 text-yellow-400 font-tech">
                <Clock className="w-4 h-4" />
                <span>Click to vote on this proposal</span>
              </div>
            ) : null}
          </motion.div>
        ))
      )}
    </div>
  </motion.div>
);

// Create Tab Component
const CreateTab: React.FC<any> = ({ userStake, daoConfig, onCreateProposal, onCreateConfigProposal, isLoading }) => {
  const [proposalType, setProposalType] = useState<'general' | 'config'>('general');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    duration: daoConfig.defaultProposalDuration / (1000 * 60 * 60) // Convert to hours
  });
  
  const [configChanges, setConfigChanges] = useState<ConfigChange[]>([]);

  const canCreateProposal = userStake?.canCreateProposals || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateProposal) return;
    
    try {
      const durationMs = formData.duration * 60 * 60 * 1000; // Convert hours to ms
      
      if (proposalType === 'config') {
        await onCreateConfigProposal(
          formData.title,
          formData.description,
          configChanges,
          durationMs
        );
      } else {
        await onCreateProposal({
          title: formData.title,
          description: formData.description,
          author: formData.author,
          authorAddress: userStake.address,
          type: 'general',
          status: 'active',
          expiresAt: Date.now() + durationMs,
          requiredQuorum: daoConfig.quorumThreshold,
          passingThreshold: daoConfig.passingThreshold
        });
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        author: '',
        duration: daoConfig.defaultProposalDuration / (1000 * 60 * 60)
      });
      setConfigChanges([]);
    } catch (error) {
      console.error('Failed to create proposal:', error);
    }
  };

  const addConfigChange = () => {
    setConfigChanges([...configChanges, {
      parameter: '',
      currentValue: '',
      proposedValue: '',
      category: 'rewards',
      description: ''
    }]);
  };

  const updateConfigChange = (index: number, field: keyof ConfigChange, value: any) => {
    const updated = [...configChanges];
    updated[index] = { ...updated[index], [field]: value };
    setConfigChanges(updated);
  };

  const removeConfigChange = (index: number) => {
    setConfigChanges(configChanges.filter((_, i) => i !== index));
  };

  if (!canCreateProposal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-cyber font-bold text-white mb-2">
            INSUFFICIENT STAKE
          </h2>
          <p className="text-gray-400 font-tech">
            You need at least {daoConfig.minStakeForProposal} ROSE staked to create proposals.
            <br />
            Current stake: {userStake?.amount || 0} ROSE
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="tech-panel p-8">
        <h2 className="text-xl font-cyber font-bold text-custom-green mb-6 flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>CREATE PROPOSAL</span>
        </h2>

        {/* Proposal Type Selection */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setProposalType('general')}
            className={`flex items-center space-x-2 px-4 py-2 rounded font-tech transition-all ${
              proposalType === 'general'
                ? 'bg-custom-gradient text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>General</span>
          </button>
          <button
            onClick={() => setProposalType('config')}
            className={`flex items-center space-x-2 px-4 py-2 rounded font-tech transition-all ${
              proposalType === 'config'
                ? 'bg-custom-gradient text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-tech text-gray-400 mb-2">
                Proposal Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="cyber-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-tech text-gray-400 mb-2">
                Author Name
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="cyber-input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-tech text-gray-400 mb-2">
              Duration (hours) - Min: {daoConfig.proposalDurationMin / (1000 * 60 * 60)}, Max: {daoConfig.proposalDurationMax / (1000 * 60 * 60)}
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min={daoConfig.proposalDurationMin / (1000 * 60 * 60)}
              max={daoConfig.proposalDurationMax / (1000 * 60 * 60)}
              className="cyber-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-tech text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="cyber-input w-full"
              required
            />
          </div>

          {/* Configuration Changes (only for config proposals) */}
          {proposalType === 'config' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-tech font-bold text-white">Configuration Changes</h3>
                <button
                  type="button"
                  onClick={addConfigChange}
                  className="cyber-btn-secondary text-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Change</span>
                </button>
              </div>

              {configChanges.map((change, index) => (
                <div key={index} className="tech-panel p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-tech font-bold text-gray-300">Change #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeConfigChange(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-tech text-gray-400 mb-2">Category</label>
                      <select
                        value={change.category}
                        onChange={(e) => updateConfigChange(index, 'category', e.target.value)}
                        className="cyber-input w-full"
                      >
                        <option value="rewards">Rewards</option>
                        <option value="regions">Regions</option>
                        <option value="sensors">Sensors</option>
                        <option value="reputation">Reputation</option>
                        <option value="roles">Roles</option>
                      </select>
                    </div>

                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-tech text-gray-400 mb-2">Current Value</label>
                      <input
                        type="text"
                        value={change.currentValue}
                        onChange={(e) => updateConfigChange(index, 'currentValue', e.target.value)}
                        className="cyber-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-tech text-gray-400 mb-2">Proposed Value</label>
                      <input
                        type="text"
                        value={change.proposedValue}
                        onChange={(e) => updateConfigChange(index, 'proposedValue', e.target.value)}
                        className="cyber-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-tech text-gray-400 mb-2">Description</label>
                    <textarea
                      value={change.description}
                      onChange={(e) => updateConfigChange(index, 'description', e.target.value)}
                      rows={2}
                      className="cyber-input w-full"
                      placeholder="Explain the reason for this change..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="cyber-btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>CREATE PROPOSAL</span>
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

// Config Tab Component
const ConfigTab: React.FC<any> = ({ daoConfig }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-6xl mx-auto"
  >
    <div className="grid md:grid-cols-2 gap-8">
      {/* Governance Settings */}
      <div className="tech-panel p-6">
        <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>GOVERNANCE</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Min Stake (Access)</span>
            <span className="font-mono text-white">{daoConfig.minStakeForAccess} ROSE</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Min Stake (Proposals)</span>
            <span className="font-mono text-white">{daoConfig.minStakeForProposal} ROSE</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Quorum Threshold</span>
            <span className="font-mono text-white">{(daoConfig.quorumThreshold * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Passing Threshold</span>
            <span className="font-mono text-white">{(daoConfig.passingThreshold * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Voting Delay</span>
            <span className="font-mono text-white">{daoConfig.votingDelay / (1000 * 60 * 60)} hours</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-tech text-gray-400">Execution Delay</span>
            <span className="font-mono text-white">{daoConfig.executionDelay / (1000 * 60 * 60)} hours</span>
          </div>
        </div>
      </div>

      {/* Reward Rates */}
      <div className="tech-panel p-6">
        <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>REWARDS</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Validator Reward</span>
            <span className="font-mono text-white">{daoConfig.validatorReward}%</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-tech text-gray-400">Data Provider Reward</span>
            <span className="font-mono text-white">{daoConfig.dataProviderReward}%</span>
          </div>
        </div>
      </div>

      {/* Region Weights */}
      <div className="tech-panel p-6">
        <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
          <Globe className="w-5 h-5" />
          <span>REGION WEIGHTS</span>
        </h3>
        
        <div className="space-y-4">
          {Object.entries(daoConfig.regionWeights).map(([region, weight]) => (
            <div key={region} className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="font-tech text-gray-400 capitalize">{region.replace('-', ' ')}</span>
              <span className="font-mono text-white">{weight}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reputation Rules */}
      <div className="tech-panel p-6">
        <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5" />
          <span>REPUTATION</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Decay Rate</span>
            <span className="font-mono text-white">{(daoConfig.reputationDecayRate * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Boost Multiplier</span>
            <span className="font-mono text-white">{daoConfig.reputationBoostMultiplier}x</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="font-tech text-gray-400">Min for Rewards</span>
            <span className="font-mono text-white">{daoConfig.minReputationForRewards}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-tech text-gray-400">Sensor Threshold</span>
            <span className="font-mono text-white">{daoConfig.sensorReputationThreshold}</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Vote Tab Component
const VoteTab: React.FC<any> = ({ proposal, userStake, account, onVote, isLoading }) => {
  const [selectedChoice, setSelectedChoice] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const hasVoted = proposal.voters.includes(account || '');
  const userVote = hasVoted ? proposal.voteBreakdown[account || ''] : null;
  const isActive = proposal.status === 'active' && Date.now() < proposal.expiresAt;

  const handleVoteClick = (choice: 'for' | 'against' | 'abstain') => {
    setSelectedChoice(choice);
    setShowConfirmation(true);
  };

  const confirmVote = async () => {
    if (selectedChoice) {
      await onVote(proposal.id, selectedChoice);
      setShowConfirmation(false);
      setSelectedChoice(null);
    }
  };

  const getVotePercentage = (votes: number) => {
    return proposal.totalVotes > 0 ? (votes / proposal.totalVotes) * 100 : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Proposal Header */}
      <div className="tech-panel p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-2xl font-cyber font-bold text-white">
                {proposal.title}
              </h1>
              <div className={`px-3 py-1 rounded text-sm font-tech font-bold ${
                proposal.status === 'active' ? 'bg-custom-green/20 text-custom-green' :
                proposal.status === 'passed' ? 'bg-green-500/20 text-green-400' :
                proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {proposal.status.toUpperCase()}
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400 font-tech mb-4">
              <span className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{proposal.author}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>
                  {isActive 
                    ? `${Math.ceil((proposal.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                    : `Ended ${new Date(proposal.expiresAt).toLocaleDateString()}`
                  }
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 font-tech text-lg leading-relaxed">
            {proposal.description}
          </p>
        </div>

        {/* Configuration Preview (for config proposals) */}
        {proposal.type === 'config' && proposal.configChanges && (
          <div className="mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>CONFIGURATION CHANGES</span>
            </h3>
            
            <div className="space-y-4">
              {proposal.configChanges.map((change: ConfigChange, index: number) => (
                <div key={index} className="p-4 bg-gray-900/50 rounded border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-tech font-bold text-white">{change.parameter}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-tech font-bold ${
                      change.category === 'rewards' ? 'bg-green-500/20 text-green-400' :
                      change.category === 'regions' ? 'bg-blue-500/20 text-blue-400' :
                      change.category === 'sensors' ? 'bg-red-500/20 text-red-400' :
                      change.category === 'reputation' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {change.category.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-tech text-gray-400 mb-1">Current Value</p>
                      <p className="font-mono text-white">{change.currentValue}</p>
                    </div>
                    <div>
                      <p className="text-sm font-tech text-gray-400 mb-1">Proposed Value</p>
                      <p className="font-mono text-custom-green">{change.proposedValue}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm font-tech text-gray-300">{change.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voting Stats */}
      <div className="tech-panel p-6">
        <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>VOTING RESULTS</span>
        </h3>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm font-tech text-gray-400 mb-1">For</p>
            <p className="text-2xl font-cyber font-bold text-green-400">{proposal.votesFor}</p>
            <p className="text-xs font-tech text-gray-500">{getVotePercentage(proposal.votesFor).toFixed(1)}%</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm font-tech text-gray-400 mb-1">Against</p>
            <p className="text-2xl font-cyber font-bold text-red-400">{proposal.votesAgainst}</p>
            <p className="text-xs font-tech text-gray-500">{getVotePercentage(proposal.votesAgainst).toFixed(1)}%</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Minus className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-sm font-tech text-gray-400 mb-1">Abstain</p>
            <p className="text-2xl font-cyber font-bold text-yellow-400">{proposal.votesAbstain}</p>
            <p className="text-xs font-tech text-gray-500">{getVotePercentage(proposal.votesAbstain).toFixed(1)}%</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-tech text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-cyber font-bold text-white">{proposal.totalVotes}</p>
            <p className="text-xs font-tech text-gray-500">{proposal.voters.length} voters</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm font-tech text-gray-400 mb-1">
              <span>FOR</span>
              <span>{getVotePercentage(proposal.votesFor).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getVotePercentage(proposal.votesFor)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm font-tech text-gray-400 mb-1">
              <span>AGAINST</span>
              <span>{getVotePercentage(proposal.votesAgainst).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getVotePercentage(proposal.votesAgainst)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm font-tech text-gray-400 mb-1">
              <span>ABSTAIN</span>
              <span>{getVotePercentage(proposal.votesAbstain).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getVotePercentage(proposal.votesAbstain)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Interface */}
      <div className="tech-panel p-6">
        <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
          <Vote className="w-5 h-5" />
          <span>CAST YOUR VOTE</span>
        </h3>

        {hasVoted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-custom-green/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-custom-green" />
            </div>
            <div>
              <p className="text-lg font-tech font-bold text-white mb-2">Vote Recorded</p>
              <p className="text-gray-400 font-tech">
                You voted <span className="text-custom-green font-bold">{userVote?.choice.toUpperCase()}</span> with {userVote?.votingPower} voting power
              </p>
              <p className="text-sm text-gray-500 font-tech mt-2">
                Signature: {userVote?.signature}
              </p>
            </div>
          </div>
        ) : isActive ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleVoteClick('for')}
                className="cyber-btn-primary flex flex-col items-center space-y-2 py-6"
              >
                <CheckCircle className="w-8 h-8" />
                <span>VOTE FOR</span>
              </button>
              
              <button
                onClick={() => handleVoteClick('against')}
                className="cyber-btn-secondary flex flex-col items-center space-y-2 py-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50"
              >
                <XCircle className="w-8 h-8" />
                <span>VOTE AGAINST</span>
              </button>
              
              <button
                onClick={() => handleVoteClick('abstain')}
                className="cyber-btn-secondary flex flex-col items-center space-y-2 py-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/50"
              >
                <Minus className="w-8 h-8" />
                <span>ABSTAIN</span>
              </button>
            </div>

            <div className="text-center text-sm font-tech text-gray-400">
              Your voting power: <span className="text-custom-green font-bold">{userStake?.votingPower || 0} ROSE</span>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-tech font-bold text-white mb-2">Voting Closed</p>
              <p className="text-gray-400 font-tech">
                This proposal is no longer accepting votes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="tech-panel p-8 max-w-md mx-4"
          >
            <h3 className="text-xl font-cyber font-bold text-white mb-4">
              CONFIRM VOTE
            </h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-300 font-tech">
                You are about to vote <span className="text-custom-green font-bold">{selectedChoice?.toUpperCase()}</span> on:
              </p>
              <p className="text-white font-tech font-bold">
                {proposal.title}
              </p>
              <p className="text-sm text-gray-400 font-tech">
                Voting power: {userStake?.votingPower || 0} ROSE
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmVote}
                disabled={isLoading}
                className="cyber-btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Hash className="w-4 h-4" />
                    <span>SIGN & VOTE</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowConfirmation(false)}
                className="cyber-btn-secondary flex-1"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default DAO;
