//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import './ExchangeProxy.sol';

import "hardhat/console.sol";

contract Dex is Initializable, OwnableUpgradeable{

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IUniswapV2Router02 internal uniswapRouter; 
    address payable recipient;
    ExchangeProxy internal balancer; 

    function initialize(address payable _recipient, address uniswap, address _balancer) public initializer{
        uniswapRouter = IUniswapV2Router02(uniswap);
        balancer = ExchangeProxy(_balancer);
        recipient = _recipient;
    }

    function makeSwap(address to, uint amount) payable public {
        require(msg.value > 0, "Not enough ETH");
        
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = to;

        uniswapRouter.swapExactETHForTokens{value: msg.value.sub(msg.value.div(1000))}(amount.sub(amount.div(1000)), path, msg.sender, block.timestamp + 3600);

        recipient.transfer(msg.value.div(1000));
    }

    function makeMultiSwap(address[] memory to, uint[] memory porc, uint[] memory amounts) payable public {
        require(msg.value > 0, "Not enough ETH");
        uint remaining = msg.value.sub(msg.value.div(1000));
        
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();

        for (uint256 i = 0; i < to.length; i++) {
            path[1] = to[i];

            uniswapRouter.swapExactETHForTokens{value: remaining.mul(porc[i]).div(100)}(amounts[i].sub(amounts[i].div(1000)), path, msg.sender, block.timestamp + 3600);
        }

        recipient.transfer(msg.value.div(1000));
    }

}