//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface IBPool {
    function getSpotPrice(address tokenIn, address tokenOut) external view returns (uint spotPrice);
}
