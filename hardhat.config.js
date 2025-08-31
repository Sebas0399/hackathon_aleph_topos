require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_URL = process.env.SEPOLIA_URL;

module.exports = {
  solidity: "0.8.19",
  networks: {
    // calibration: {
    //   url: "https://api.calibration.node.glif.io/rpc/v1",
    //   accounts: [PRIVATE_KEY],
    // },
    // filecoin: {
    //   url: "https://api.node.glif.io",
    //   accounts: [PRIVATE_KEY],
    // },
    sepolia: {
      url: SEPOLIA_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};