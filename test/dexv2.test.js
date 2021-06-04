const {BN, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { ethers, upgrades } = require("hardhat");

const ERC20 = artifacts.require("ERC20");
const Roter02 = artifacts.require("IUniswapV2Router02");
const IBalancer = artifacts.require("ExchangeProxy");
const IBPool = artifacts.require("IBPool");

const Aggregator = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const Uniswap = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const Balancer = "0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21";

const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const ALBT = '0x00a8b738E453fFd858a7edf03bcCfe20412f0Eb0';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const AAVE = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';

describe("DexV2", () => {
  let dex;
  let uniswap;
  let balancer;
  let amountToBuy;

  let user;
  let recipient;
  
  before(async () => {
    [user, recipient] = await ethers.getSigners();

    const Dex = await ethers.getContractFactory("Dex");
    dex = await upgrades.deployProxy(Dex, [recipient.address, Uniswap, Balancer]);
    await dex.deployed();
    
    const DexV2 = await ethers.getContractFactory("DexV2");
    dex = await upgrades.upgradeProxy(dex.address, DexV2);
    console.log("dexv2 upgraded", dex.address);

    uniswap = await Roter02.at(Uniswap);
    balancer = await IBalancer.at(Balancer);
  });
  
  it("Should buy 1 token with balancer", async () => {
    let etherAmount = 1;

    const erc20 = await ERC20.at(USDC);
    const pools = await balancer.viewSplitExactIn(WETH, USDC, etherAmount, 10);
    let amountToBuy = 0;
    for (const swap of pools.swaps) {
      const pool = await IBPool.at(swap.pool);
      let price = await pool.getSpotPrice(WETH,USDC);
      let amount = etherAmount/(Number(web3.utils.fromWei(price))/10**(18-Number(await erc20.decimals())));
      if(amount > amountToBuy) amountToBuy = amount;
    }
    
    let prevBalance = Number(await erc20.balanceOf(user.address));
    await dex.connect(user).makeSwapBal(USDC, parseInt(amountToBuy), {value: web3.utils.toWei(String(etherAmount))});
    let postBalance = Number(await erc20.balanceOf(user.address));
    assert(Number(prevBalance) < Number(postBalance));
  })

  it("Should swap several tokens with balancer", async () => {
    let etherAmount = "1";
    let toToken = [USDC,UNI,DAI];
    let porcToken = [25,40,35];
    let amounts = [];
    for (let i = 0; i < toToken.length; i++) {
      const erc20 = await ERC20.at(toToken[i]);
      const pools = await balancer.viewSplitExactIn(WETH, toToken[i], parseInt(etherAmount), 10);
      let amountToBuy = 0;
      for (const swap of pools.swaps) {
        const pool = await IBPool.at(swap.pool);
        let price = await pool.getSpotPrice(WETH,toToken[i]);
        let amount = ((web3.utils.toWei(etherAmount)*porcToken[i])/100)/Number(web3.utils.fromWei(price));
        // let amount = ((parseInt(etherAmount)*porcToken[i])/100)/(Number(web3.utils.fromWei(price))/10**(18-Number(await erc20.decimals())));
        if(amount > amountToBuy) amountToBuy = amount;
        // if(price > amountToBuy) amountToBuy = price;
      }
      amounts.push(amountToBuy.toFixed(2))
    }

    console.log(`amounts`, amounts)
    
    const usdc = await ERC20.at(USDC);
    const uni = await ERC20.at(UNI);
    const dai = await ERC20.at(DAI);

    let prevBalanceusdc = await usdc.balanceOf(user.address);
    let prevBalanceuni = await uni.balanceOf(user.address);
    let prevBalancedai = await dai.balanceOf(user.address);
    let prevBalanceRecipient = await recipient.getBalance();

    await dex.connect(user).makeMultiSwapBal(toToken, porcToken, amounts, {value: web3.utils.toWei(etherAmount)});
    
    let postBalanceusdc = await usdc.balanceOf(user.address);
    let postBalanceuni = await uni.balanceOf(user.address);
    let postBalancedai = await dai.balanceOf(user.address);
    let postBalanceRecipient = await recipient.getBalance();

    assert(
      Number(prevBalanceusdc) < Number(postBalanceusdc) &&
      Number(prevBalanceuni) < Number(postBalanceuni) &&
      Number(prevBalancedai) < Number(postBalancedai) &&
      Number(prevBalanceRecipient) < Number(postBalanceRecipient)
    );
  })

});