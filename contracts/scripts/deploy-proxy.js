async function main() {
  // Load deployment info
  const fs = require('fs');
  const path = require('path');
  
  const deploymentPath = path.join(__dirname, '../deployment.json');
  let deployment;
  
  try {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  } catch (error) {
    console.error('❌ Could not read deployment.json. Please deploy main contracts first.');
    process.exit(1);
  }

  console.log('🔐 Deploying ConfidentialProxy for CONFIDENTIAL format transactions...\n');
  
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log('Deploying with account:', deployerAddress);
  console.log('Account balance:', ethers.formatEther(await deployer.provider.getBalance(deployerAddress)), 'ROSE');
  console.log('Sensor contract address:', deployment.contracts.SensorNFA);
  
  // Deploy ConfidentialProxy
  console.log('\n📋 Deploying ConfidentialProxy...');
  const ConfidentialProxy = await ethers.getContractFactory('ConfidentialProxy');
  const proxy = await ConfidentialProxy.deploy(deployment.contracts.SensorNFA);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  
  console.log('✅ ConfidentialProxy deployed to:', proxyAddress);
  
  // Fund the proxy with some ROSE for gas
  console.log('\n💰 Funding proxy with 1 ROSE for gas...');
  const fundTx = await deployer.sendTransaction({
    to: proxyAddress,
    value: ethers.parseEther('1.0')
  });
  await fundTx.wait();
  console.log('✅ Proxy funded with 1 ROSE');
  
  // Set up keypair for signing confidential transactions
  console.log('\n🔑 Setting up keypair for confidential transaction signing...');
  
  // Generate a new keypair for the proxy (in production, use secure key management)
  const proxyWallet = ethers.Wallet.createRandom();
  
  // Fund the proxy signer wallet with some ROSE
  const fundSignerTx = await deployer.sendTransaction({
    to: proxyWallet.address,
    value: ethers.parseEther('2.0')
  });
  await fundSignerTx.wait();
  console.log('✅ Proxy signer wallet funded:', proxyWallet.address);
  
  // Set the keypair in the proxy contract
  const setKeypairTx = await proxy.setKeypair({
    addr: proxyWallet.address,
    secret: proxyWallet.privateKey,
    nonce: 0
  });
  await setKeypairTx.wait();
  console.log('✅ Keypair set in proxy contract');
  
  // Update deployment.json with proxy info
  deployment.contracts.ConfidentialProxy = proxyAddress;
  deployment.proxyWallet = {
    address: proxyWallet.address,
    privateKey: proxyWallet.privateKey
  };
  deployment.timestamp = new Date().toISOString();
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log('✅ Deployment info updated');
  
  console.log('\n🎉 ConfidentialProxy deployment completed!');
  console.log('📋 Proxy Address:', proxyAddress);
  console.log('🔑 Proxy Signer:', proxyWallet.address);
  console.log('💰 Proxy Balance:', ethers.formatEther(await deployer.provider.getBalance(proxyAddress)), 'ROSE');
  console.log('💰 Signer Balance:', ethers.formatEther(await deployer.provider.getBalance(proxyWallet.address)), 'ROSE');
  
  console.log('\n🔐 This proxy will create CONFIDENTIAL format transactions using:');
  console.log('   ✅ EIP155Signer for transaction signing');
  console.log('   ✅ encryptCallData for calldata encryption');
  console.log('   ✅ Proper CONFIDENTIAL transaction format');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });