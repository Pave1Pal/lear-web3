require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({
  path: ".env"
});

const providerURL = process.env.PROVIDER_HTTP_URL;
const privatekey = process.env.PRIVATE_KEY;

module.exports = {
  solidity: "0.8.18",
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {},
    sepolia: {
      url: providerURL,
      accounts: [privatekey]
    }
  }
};
