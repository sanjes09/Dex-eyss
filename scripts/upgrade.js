const { ethers, upgrades } = require("hardhat");

const Previous_Address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

async function main() {
  const DexV2 = await ethers.getContractFactory("DexV2");
  const dexv2 = await upgrades.upgradeProxy(Previous_Address, DexV2);
  console.log("dexv2 upgraded", dexv2.address);
}

main();