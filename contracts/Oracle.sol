//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import '@chainlink/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol';

contract Oracle{

    AggregatorV3Interface internal priceFeed; 

    constructor(address ethPrice){
        priceFeed = AggregatorV3Interface(ethPrice);
    }

    function getLatestPrice() public view returns (int256) {
        (
            /* uint80 roundId */,
            int256 answer,
            /* uint256 startedAt */,
            /* uint256 updatedAt */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        return answer;
        // int weiUsd = 10**26/answer;
        // return uint(weiUsd);
    }
}