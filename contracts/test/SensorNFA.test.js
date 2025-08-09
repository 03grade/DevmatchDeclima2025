const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SensorNFA", function () {
  let sensorNFA;
  let owner, addr1, addr2, roflAddress;
  
  beforeEach(async function () {
    [owner, addr1, addr2, roflAddress] = await ethers.getSigners();
    
    const SensorNFA = await ethers.getContractFactory("SensorNFA");
    sensorNFA = await SensorNFA.deploy(owner.address);
    await sensorNFA.waitForDeployment();
    
    // Add ROFL as authorized
    await sensorNFA.addAuthorizedROFL(roflAddress.address);
  });
  
  describe("Sensor Minting", function () {
    it("Should mint a sensor successfully", async function () {
      const sensorId = "sensor-uuid-123";
      const ipfsMetadata = "QmTest123";
      
      await expect(sensorNFA.connect(addr1).mintSensor(sensorId, ipfsMetadata))
        .to.emit(sensorNFA, "SensorMinted")
        .withArgs(addr1.address, 1, sensorId, await time.latest());
      
      expect(await sensorNFA.sensorExists(sensorId)).to.be.true;
      expect(await sensorNFA.ownerOf(1)).to.equal(addr1.address);
    });
    
    it("Should prevent duplicate sensor IDs", async function () {
      const sensorId = "sensor-uuid-123";
      const ipfsMetadata = "QmTest123";
      
      await sensorNFA.connect(addr1).mintSensor(sensorId, ipfsMetadata);
      
      await expect(
        sensorNFA.connect(addr2).mintSensor(sensorId, ipfsMetadata)
      ).to.be.revertedWith("Sensor ID already exists");
    });
    
    it("Should initialize with correct reputation", async function () {
      const sensorId = "sensor-uuid-123";
      const ipfsMetadata = "QmTest123";
      
      await sensorNFA.connect(addr1).mintSensor(sensorId, ipfsMetadata);
      
      const metadata = await sensorNFA.getSensorMetadata(sensorId);
      expect(metadata.reputationScore).to.equal(100);
      expect(metadata.isActive).to.be.true;
      expect(metadata.totalSubmissions).to.equal(0);
    });
  });
  
  describe("Reputation Management", function () {
    beforeEach(async function () {
      const sensorId = "sensor-uuid-123";
      const ipfsMetadata = "QmTest123";
      await sensorNFA.connect(addr1).mintSensor(sensorId, ipfsMetadata);
    });
    
    it("Should allow authorized ROFL to update reputation", async function () {
      const sensorId = "sensor-uuid-123";
      const newScore = 150;
      const reason = "Good data quality";
      
      await expect(
        sensorNFA.connect(roflAddress).updateReputation(sensorId, newScore, reason)
      ).to.emit(sensorNFA, "ReputationUpdated")
        .withArgs(sensorId, 100, newScore, reason);
      
      const metadata = await sensorNFA.getSensorMetadata(sensorId);
      expect(metadata.reputationScore).to.equal(newScore);
    });
    
    it("Should prevent unauthorized reputation updates", async function () {
      const sensorId = "sensor-uuid-123";
      const newScore = 150;
      const reason = "Good data quality";
      
      await expect(
        sensorNFA.connect(addr2).updateReputation(sensorId, newScore, reason)
      ).to.be.revertedWith("Not authorized ROFL");
    });
    
    it("Should enforce reputation bounds", async function () {
      const sensorId = "sensor-uuid-123";
      const invalidScore = 250; // Above max of 200
      const reason = "Test";
      
      await expect(
        sensorNFA.connect(roflAddress).updateReputation(sensorId, invalidScore, reason)
      ).to.be.revertedWith("Score exceeds maximum");
    });
  });
  
  describe("Sensor Status Management", function () {
    beforeEach(async function () {
      const sensorId = "sensor-uuid-123";
      const ipfsMetadata = "QmTest123";
      await sensorNFA.connect(addr1).mintSensor(sensorId, ipfsMetadata);
    });
    
    it("Should allow owner to change sensor status", async function () {
      const sensorId = "sensor-uuid-123";
      
      await expect(sensorNFA.connect(addr1).setSensorStatus(sensorId, false))
        .to.emit(sensorNFA, "SensorStatusChanged")
        .withArgs(sensorId, false, await time.latest());
      
      const metadata = await sensorNFA.getSensorMetadata(sensorId);
      expect(metadata.isActive).to.be.false;
    });
    
    it("Should allow authorized ROFL to change sensor status", async function () {
      const sensorId = "sensor-uuid-123";
      
      await expect(sensorNFA.connect(roflAddress).setSensorStatus(sensorId, false))
        .to.emit(sensorNFA, "SensorStatusChanged");
      
      const metadata = await sensorNFA.getSensorMetadata(sensorId);
      expect(metadata.isActive).to.be.false;
    });
    
    it("Should prevent unauthorized status changes", async function () {
      const sensorId = "sensor-uuid-123";
      
      await expect(
        sensorNFA.connect(addr2).setSensorStatus(sensorId, false)
      ).to.be.revertedWith("Not authorized to change status");
    });
  });
  
  describe("Ownership and Transfer", function () {
    beforeEach(async function () {
      const sensorId = "sensor-uuid-123";
      const ipfsMetadata = "QmTest123";
      await sensorNFA.connect(addr1).mintSensor(sensorId, ipfsMetadata);
    });
    
    it("Should track sensors by owner", async function () {
      const sensorsByOwner = await sensorNFA.getSensorsByOwner(addr1.address);
      expect(sensorsByOwner).to.have.lengthOf(1);
      expect(sensorsByOwner[0]).to.equal("sensor-uuid-123");
    });
    
    it("Should update owner mappings on transfer", async function () {
      const tokenId = 1;
      
      // Transfer the NFT
      await sensorNFA.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId);
      
      // Check ownership updated
      expect(await sensorNFA.ownerOf(tokenId)).to.equal(addr2.address);
      
      // Check mappings updated
      const addr1Sensors = await sensorNFA.getSensorsByOwner(addr1.address);
      const addr2Sensors = await sensorNFA.getSensorsByOwner(addr2.address);
      
      expect(addr1Sensors).to.have.lengthOf(0);
      expect(addr2Sensors).to.have.lengthOf(1);
      expect(addr2Sensors[0]).to.equal("sensor-uuid-123");
    });
  });
});