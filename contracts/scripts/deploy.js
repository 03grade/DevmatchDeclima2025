const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting D-Climate Smart Contract Deployment to Oasis Sapphire...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("🔑 Deploying contracts with account:", deployerAddress);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployerAddress)), "ROSE");
  
  // Contract deployment order (due to dependencies)
  console.log("\n📝 Step 1: Deploying SensorNFA contract...");
  const SensorNFA = await ethers.getContractFactory("SensorNFA");
  const sensorNFA = await SensorNFA.deploy(deployerAddress);
  await sensorNFA.waitForDeployment();
  const sensorNFAAddress = await sensorNFA.getAddress();
  console.log("✅ SensorNFA deployed to:", sensorNFAAddress);
  
  console.log("\n📝 Step 2: Deploying DataRegistry contract...");
  const DataRegistry = await ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistry.deploy(deployerAddress, sensorNFAAddress);
  await dataRegistry.waitForDeployment();
  const dataRegistryAddress = await dataRegistry.getAddress();
  console.log("✅ DataRegistry deployed to:", dataRegistryAddress);
  
  console.log("\n📝 Step 3: Deploying RewardDistributor contract...");
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(
    deployerAddress,
    sensorNFAAddress,
    dataRegistryAddress
  );
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddress = await rewardDistributor.getAddress();
  console.log("✅ RewardDistributor deployed to:", rewardDistributorAddress);
  
  console.log("\n📝 Step 4: Deploying DAOGovernance contract...");
  const DAOGovernance = await ethers.getContractFactory("DAOGovernance");
  const daoGovernance = await DAOGovernance.deploy(deployerAddress, rewardDistributorAddress);
  await daoGovernance.waitForDeployment();
  const daoGovernanceAddress = await daoGovernance.getAddress();
  console.log("✅ DAOGovernance deployed to:", daoGovernanceAddress);
  
  console.log("\n🔧 Step 5: Setting up contract permissions...");
  
  // Set DataRegistry as authorized ROFL for SensorNFA
  console.log("🔐 Authorizing DataRegistry in SensorNFA...");
  await sensorNFA.addAuthorizedROFL(dataRegistryAddress);
  
  // Set RewardDistributor as authorized ROFL for SensorNFA
  console.log("🔐 Authorizing RewardDistributor in SensorNFA...");
  await sensorNFA.addAuthorizedROFL(rewardDistributorAddress);
  
  // Set RewardDistributor as authorized ROFL for DataRegistry
  console.log("🔐 Authorizing RewardDistributor in DataRegistry...");
  await dataRegistry.addAuthorizedROFL(rewardDistributorAddress);
  
  console.log("\n💰 Step 6: Funding RewardDistributor with initial ROSE...");
  const initialFunding = ethers.parseEther("1000"); // 1000 ROSE for initial rewards
  await rewardDistributor.fundRewards({ value: initialFunding });
  console.log("✅ RewardDistributor funded with", ethers.formatEther(initialFunding), "ROSE");
  
  // Transfer ownership to DAO (optional for production)
  // console.log("\n👑 Step 7: Transferring ownership to DAO...");
  // await rewardDistributor.transferOwnership(daoGovernanceAddress);
  // console.log("✅ RewardDistributor ownership transferred to DAO");
  
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=" * 60);
  console.log("📋 DEPLOYED CONTRACT ADDRESSES:");
  console.log("=" * 60);
  console.log("🔗 SensorNFA:        ", sensorNFAAddress);
  console.log("🔗 DataRegistry:     ", dataRegistryAddress);
  console.log("🔗 RewardDistributor:", rewardDistributorAddress);
  console.log("🔗 DAOGovernance:    ", daoGovernanceAddress);
  console.log("=" * 60);
  
  console.log("\n💾 Saving addresses to deployment.json...");
  const deploymentInfo = {
    network: "sapphire-testnet",
    timestamp: new Date().toISOString(),
          deployer: deployerAddress,
    contracts: {
      SensorNFA: sensorNFAAddress,
      DataRegistry: dataRegistryAddress,
      RewardDistributor: rewardDistributorAddress,
      DAOGovernance: daoGovernanceAddress
    },
    gasUsed: {
      // Would track gas usage in production
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("✅ Deployment info saved to deployment.json");
  
  console.log("\n🔗 Next Steps:");
  console.log("1. Update your .env file with the contract addresses");
  console.log("2. Verify contracts on block explorer (optional)");
  console.log("3. Deploy and configure ROFL runtime");
  console.log("4. Start the API server");
  console.log("5. Launch the frontend");
  
  console.log("\n🔍 Verification Commands:");
  console.log(`npx hardhat verify --network sapphire-testnet ${sensorNFAAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network sapphire-testnet ${dataRegistryAddress} ${deployer.address} ${sensorNFAAddress}`);
  console.log(`npx hardhat verify --network sapphire-testnet ${rewardDistributorAddress} ${deployer.address} ${sensorNFAAddress} ${dataRegistryAddress}`);
  console.log(`npx hardhat verify --network sapphire-testnet ${daoGovernanceAddress} ${deployer.address} ${rewardDistributorAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });