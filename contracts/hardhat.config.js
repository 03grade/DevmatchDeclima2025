require("@nomicfoundation/hardhat-toolbox");
require("@oasisprotocol/sapphire-hardhat");
require("dotenv").config({ path: "../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    "sapphire-testnet": {
      url: "https://testnet.sapphire.oasis.dev",
      accounts: ["0x6275efe0945c0a8f17d5bc4867788fb5aecc796c7430630bf97046d0d3734275"],
      chainId: 0x5aff
    },
    "sapphire-mainnet": {
      url: "https://sapphire.oasis.io",
      accounts: ["0x6275efe0945c0a8f17d5bc4867788fb5aecc796c7430630bf97046d0d3734275"],
      chainId: 0x5afe
    }
  },
  etherscan: {
    apiKey: {
      "sapphire-testnet": "dummy",
      "sapphire-mainnet": "dummy"
    },
    customChains: [
      {
        network: "sapphire-testnet",
        chainId: 0x5aff,
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev"
        }
      },
      {
        network: "sapphire-mainnet",
        chainId: 0x5afe,
        urls: {
          apiURL: "https://explorer.sapphire.oasis.io/api",
          browserURL: "https://explorer.sapphire.oasis.io"
        }
      }
    ]
  }
};