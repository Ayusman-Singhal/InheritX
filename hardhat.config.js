require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // For environment variables

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Default Solidity version, can be adjusted as per contract
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/"
    },
    tcoreTestnet: {
      url: process.env.TCORE_RPC_URL || "https://rpc.test2.btcs.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1114,
      gasPrice: 20000000000 // 20 gwei
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000 // Optional: extend timeout for tests
  },
  etherscan: {
    apiKey: {
      tcoreTestnet: process.env.TCORE_EXPLORER_API_KEY || "NO_API_KEY_REQUIRED"
    },
    customChains: [
      {
        network: "tcoreTestnet",
        chainId: 1114,
        urls: {
          apiURL: "https://scan.test2.btcs.network/api",
          browserURL: "https://scan.test2.btcs.network"
        }
      }
    ]
  }
};
