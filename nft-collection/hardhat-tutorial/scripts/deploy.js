const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

const whitelistContract = "0x598560CB476D83caDCC54735B086144920D37D02";
const metadataURL = "https://nft-collection-sneh1999.vercel.app/api/";

async function main() {
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");
  const deployedCryptoDevContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );
  await deployedCryptoDevContract.deployed();
  console.log("Crypto Devs Contract Address:", deployedCryptoDevContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
