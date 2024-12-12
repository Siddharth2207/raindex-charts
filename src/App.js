import React, { useState } from 'react';
import {
  SciChartSurface,
  NumericAxis,
  XyDataSeries,
  FastMountainRenderableSeries,
  EAutoRange,
  TextAnnotation,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
} from "scichart";

import axios from 'axios';
import { ethers } from 'ethers';
import './App.css';

SciChartSurface.loadWasmFromCDN();

const IO = "(address token, uint8 decimals, uint256 vaultId)";
const EvaluableV3 = "(address interpreter, address store, bytes bytecode)";
const SignedContextV1 = "(address signer, uint256[] context, bytes signature)";
const OrderV3 = `(address owner, ${EvaluableV3} evaluable, ${IO}[] validInputs, ${IO}[] validOutputs, bytes32 nonce)`;
const TakeOrderConfigV3 = `(${OrderV3} order, uint256 inputIOIndex, uint256 outputIOIndex, ${SignedContextV1}[] signedContext)`;
const QuoteConfig = TakeOrderConfigV3;

// Configuration for networks and subgraphs
const config = {
  networks: {
    flare: { rpc: 'https://rpc.ankr.com/flare', chainId: 14, currency: 'FLR' },
    base: { rpc: 'https://mainnet.base.org', chainId: 8453, currency: 'ETH' },
    sepolia: { rpc: 'https://1rpc.io/sepolia', chainId: 11155111, currency: 'ETH' },
    polygon: { rpc: 'https://rpc.ankr.com/polygon', chainId: 137, currency: 'POL' },
    arbitrum: { rpc: 'https://rpc.ankr.com/arbitrum', chainId: 42161, currency: 'ETH' },
    matchain: { rpc: 'https://rpc.matchain.io', chainId: 698, currency: 'BNB' },
    bsc: { rpc: 'https://rpc.ankr.com/bsc', chainId: 56, currency: 'BNB' },
    linea: { rpc: 'https://rpc.linea.build', chainId: 59144, currency: 'ETH' },
    mainnet: { rpc: 'https://rpc.ankr.com/eth', chainId: 1, currency: 'ETH' },
  },
  subgraphs: {
    flare: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-flare/0.8/gn',
    base: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-base/0.9/gn',
    polygon: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-polygon/0.6/gn',
    arbitrum: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-arbitrum/0.2/gn',
    bsc: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-bsc/2024-10-14-63f4/gn',
    linea: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-linea/2024-10-14-12fc/gn',
    mainnet: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-mainnet/2024-10-25-af6a/gn',
  },
};

const baseTokenConfig = {
  IOEN: {
    symbol: 'IOEN',
    decimals: 18,
    network: 'polygon',
    address: '0xd0e9c8f5fae381459cf07ec506c1d2896e8b5df6'
  },
  MNW: {
    symbol: 'MNW',
    decimals: 18,
    network: 'polygon',
    address: '0x3c59798620e5fec0ae6df1a19c6454094572ab92'
  },
  WPOL: {
    symbol: 'WPOL',
    network: 'polygon',
    decimals: 18,
    address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
  },
  QUICK_OLD: {
    symbol: 'QUICK',
    network: 'polygon',
    decimals: 18,
    address: '0xb5c064f955d8e7f38fe0460c556a72987494ee17'
  },
  QUICK_NEW: {
    symbol: 'QUICK',
    network: 'polygon',
    decimals: 18,
    address: '0x831753dd7087cac61ab5644b308642cc1c33dc13'
  },
  TFT: {
    symbol: 'TFT',
    decimals: 7,
    network: 'bsc',
    address: '0x8f0fb159380176d324542b3a7933f0c2fd0c2bbf'
  },
  PAID: {
    symbol: 'PAID',
    network: 'base',
    decimals: 18,
    address: '0x655a51e6803faf50d4ace80fa501af2f29c856cf'
  },
  LUCKY: {
    symbol: 'LUCKY',
    network: 'base',
    decimals: 18,
    address: '0x2c002ffec41568d138acc36f5894d6156398d539'
  },
  WLTH: {
    symbol: 'WLTH',
    network: 'base',
    decimals: 18,
    address: '0x99b2b1a2adb02b38222adcd057783d7e5d1fcc7d'
  },
  WFLR: {
    symbol: 'WFLR',
    network: 'flare',
    decimals: 18,
    address: '0x1d80c49bbbcd1c0911346656b529df9e5c2f783d'
  },
  sFLR: {
    symbol: 'sFLR',
    network: 'flare',
    decimals: 18,
    address: '0x12e605bc104e93b45e1ad99f9e555f659051c2bb'
  },
  PAI: {
    symbol: 'PAI',
    network: 'mainnet',
    decimals: 18,
    address: '0x13e4b8cffe704d3de6f19e52b201d92c21ec18bd'
  },
  LOCK: {
    symbol: 'LOCK',
    network: 'mainnet',
    decimals: 18,
    address: '0x922d8563631b03c2c4cf817f4d18f6883aba0109'
  },
  UMJA: {
    symbol: 'UMJA',
    network: 'arbitrum',
    decimals: 18,
    address: '0x16A500Aec6c37F84447ef04E66c57cfC6254cF92'
  },
};

const quoteTokenConfig = {
  POLYGON_USDC: {
    symbol: 'USDC',
    network: 'polygon',
    decimals: 18,
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
  },
  BSC_BUSD: {
    symbol: 'BUSD',
    network: 'bsc',
    decimals: 18,
    address: '0xe9e7cea3dedca5984780bafc599bd69add087d56'
  },
  BASE_USDC: {
    symbol: 'USDC',
    network: 'base',
    decimals: 6,
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  },
  ETHEREUM_WETH: {
    symbol: 'WETH',
    network: 'mainnet',
    decimals: 18,
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  },
  WFLR: {
    symbol: 'WFLR',
    network: 'flare',
    decimals: 18,
    address: '0x1d80c49bbbcd1c0911346656b529df9e5c2f783d'
  },
  sFLR: {
    symbol: 'sFLR',
    network: 'flare',
    decimals: 18,
    address: '0x12e605bc104e93b45e1ad99f9e555f659051c2bb'
  },
};

const orderbookAbi = [
  `function quote(${QuoteConfig} calldata quoteConfig) external view returns (bool exists, uint256 outputMax, uint256 ioRatio)`
];

const orderQuery = `query OrdersListQuery($skip: Int = 0, $first: Int = 1000) {
  orders(
    orderBy: timestampAdded
    orderDirection: desc
    skip: $skip
    first: $first
    where: {active: true}
  ) {
    orderHash
    owner
    orderBytes
    outputs {
      id
      token {
        id
        address
        name
        symbol
        decimals
      }
      balance
      vaultId
    }
    inputs {
      id
      token {
        id
        address
        name
        symbol
        decimals
      }
      balance
      vaultId
    }
    orderbook {
      id
    }
    active
    timestampAdded
  }
}`;

function App() {
  const [orders, setOrders] = useState([]);
  const [network, setNetwork] = useState();
  const [networkProvider, setNetworkProvider] = useState();
  const [networkEndpoint, setNetworkEndpoint] = useState();
  const [baseToken, setBaseToken] = useState();
  const [quoteToken, setQuoteToken] = useState();


  async function getCombinedOrders(orders, baseToken, quoteToken) {
    let combinedOrders = [];
    
  
    for (let i = 0; i < orders.length; i++) {
      let currentOrder = orders[i];
      const currentDecodedOrder = ethers.utils.defaultAbiCoder.decode([OrderV3], currentOrder.orderBytes)[0];

      // Process Buy Orders
      let isBuyInput = false, isBuyOutput = false;
      let buyInputIndex, buyOutputIndex;
  
      for (let j = 0; j < currentDecodedOrder.validInputs.length; j++) {
        let inputVault = currentDecodedOrder.validInputs[j];
        if (inputVault.token.toLowerCase() === baseToken.toLowerCase()) {
          isBuyInput = true;
          buyInputIndex = j;
        }
      }
      for (let j = 0; j < currentDecodedOrder.validOutputs.length; j++) {
        let outputVault = currentDecodedOrder.validOutputs[j];
        if (outputVault.token.toLowerCase() === quoteToken.toLowerCase()) {
          isBuyOutput = true;
          buyOutputIndex = j;
        }
      }
  
      if (isBuyInput && isBuyOutput) {
        try{
          const orderbookAddress = currentOrder.orderbook.id;
          const orderBookContract = new ethers.Contract(orderbookAddress, orderbookAbi, networkProvider);
    
          const buyOrderQuote = await networkProvider.call({
            to: orderbookAddress,
            from: ethers.Wallet.createRandom().address,
            data: orderBookContract.interface.encodeFunctionData("quote", [{
              order: currentDecodedOrder,
              inputIOIndex: buyInputIndex,
              outputIOIndex: buyOutputIndex,
              signedContext: []
            }])
          });
    
          const decodedBuyQuote = ethers.utils.defaultAbiCoder.decode(
            ["bool", "uint256", "uint256"],
            buyOrderQuote
          );
    
          const buyAmount = decodedBuyQuote[1].toString() / 1e18;
          const buyOrderRatio = decodedBuyQuote[2].toString() / 1e18;
    
          combinedOrders.push({
            orderHash: currentOrder.orderHash,
            side: 'buy',
            ioRatio: 1 / buyOrderRatio,
            outputAmount: buyAmount * buyOrderRatio
          });
        }catch{
          console.log("Error getting quote for order : ", currentOrder.orderHash)
        }
        
      }
  
      // Process Sell Orders
      let isSellInput = false, isSellOutput = false;
      let sellInputIndex, sellOutputIndex;
  
      for (let j = 0; j < currentDecodedOrder.validInputs.length; j++) {
        let inputVault = currentDecodedOrder.validInputs[j];
        if (inputVault.token.toLowerCase() === quoteToken.toLowerCase()) {
          isSellInput = true;
          sellInputIndex = j;
        }
      }
      for (let j = 0; j < currentDecodedOrder.validOutputs.length; j++) {
        let outputVault = currentDecodedOrder.validOutputs[j];
        if (outputVault.token.toLowerCase() === baseToken.toLowerCase()) {
          isSellOutput = true;
          sellOutputIndex = j;
        }
      }
  
      if (isSellInput && isSellOutput) {
        try{
          const orderbookAddress = currentOrder.orderbook.id;
          const orderBookContract = new ethers.Contract(orderbookAddress, orderbookAbi, networkProvider);
          const sellOrderQuote = await networkProvider.call({
            to: orderbookAddress,
            from: ethers.Wallet.createRandom().address,
            data: orderBookContract.interface.encodeFunctionData("quote", [{
              order: currentDecodedOrder,
              inputIOIndex: sellInputIndex,
              outputIOIndex: sellOutputIndex,
              signedContext: []
            }])
          });
          const decodedSellQuote = ethers.utils.defaultAbiCoder.decode(
            ["bool", "uint256", "uint256"],
            sellOrderQuote
          );
    
          const sellAmount = decodedSellQuote[1].toString() / 1e18;
          const sellOrderRatio = decodedSellQuote[2].toString() / 1e18;
    
          combinedOrders.push({
            orderHash: currentOrder.orderHash,
            side: 'sell',
            ioRatio: sellOrderRatio,
            outputAmount: sellAmount
          });

        }catch(error){
          console.log("Error getting quote for order : ", currentOrder.orderHash)
        }
        
      }
    }
  
    return combinedOrders.filter(order => {return order.outputAmount > 0});
  }

  async function fetchOrders() {
    try {
      // Fetch orders from GraphQL
      const queryResult = await axios.post(networkEndpoint, { query: orderQuery });
      const orders = queryResult.data.data.orders;
      const {  address: baseTokenAddress } = baseTokenConfig[baseToken];
      const {  address: quoteTokenAddress } = quoteTokenConfig[quoteToken];

      const sampleOrders = await getCombinedOrders(orders, baseTokenAddress, quoteTokenAddress);

      setOrders(sampleOrders);
      renderDepthChart(sampleOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }


  async function renderDepthChart(orders) {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create("scichart-root");
  
    // Add X and Y axes
    sciChartSurface.xAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: `${baseToken.toUpperCase()} Price`,
        autoRange: EAutoRange.Always,
        labelPrecision: 6,
      })
    );
    sciChartSurface.yAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: `${baseToken.toUpperCase()} Cumulative Quantity`,
        autoRange: EAutoRange.Always,
        labelPrecision: 6,
      })
    );
  
    // Add the chart title using TextAnnotation
    sciChartSurface.annotations.add(
      new TextAnnotation({
        text: "TFT-BUSD Raindex Market Depth Chart",
        fontSize: 24, // Larger font for better visibility
        textColor: "white", // Ensure the text contrasts with the background
        x1: 0.5, // Center horizontally in relative mode
        y1: 1, // Place at the top in relative mode
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        verticalAnchorPoint: EVerticalAnchorPoint.Top,
        xCoordinateMode: "Relative", // Use relative positioning
        yCoordinateMode: "Relative", // Use relative positioning
      })
    );
  
    // Separate and sort buy and sell orders
    const buyOrders = orders
      .filter((o) => o.side === "buy" && o.outputAmount > 0)
      .sort((a, b) => b.ioRatio - a.ioRatio);
    const sellOrders = orders
      .filter((o) => o.side === "sell" && o.outputAmount > 0)
      .sort((a, b) => a.ioRatio - b.ioRatio);
    // Compute cumulative volumes
    let cumulativeBuy = 0;
    const buyDepthData = buyOrders.map((order) => {
      cumulativeBuy += order.outputAmount;
      return { x: order.ioRatio, y: cumulativeBuy };
    });
  
    let cumulativeSell = 0;
    const sellDepthData = sellOrders.map((order) => {
      cumulativeSell += order.outputAmount;
      return { x: order.ioRatio, y: cumulativeSell };
    });
  
    // Add buy and sell depth series
    const buySeries = new FastMountainRenderableSeries(wasmContext, {
      dataSeries: new XyDataSeries(wasmContext, {
        xValues: buyDepthData.map((point) => point.x),
        yValues: buyDepthData.map((point) => point.y),
      }),
      stroke: "green",
      fill: "rgba(0, 137, 0, 0.2)",
      strokeThickness: 2,
      isDigitalLine: true,
    });
  
    const sellSeries = new FastMountainRenderableSeries(wasmContext, {
      dataSeries: new XyDataSeries(wasmContext, {
        xValues: sellDepthData.map((point) => point.x),
        yValues: sellDepthData.map((point) => point.y),
      }),
      stroke: "red",
      fill: "rgba(137, 0, 0, 0.2)",
      strokeThickness: 2,
      isDigitalLine: true,
    });
  
    sciChartSurface.renderableSeries.add(buySeries, sellSeries);
  }
  


  const handleNetworkChange = (newNetwork) => {
    setNetwork(newNetwork);
    setNetworkProvider(new ethers.providers.JsonRpcProvider(config.networks[newNetwork].rpc));
    setNetworkEndpoint(config.subgraphs[newNetwork]);
  };

  return (
    <div className="container">
      <h2 className="header">Market Depth Chart</h2>
      <div className="form-group">
        <label className="form-label">
          Network : 
          <select
            value={network || ''}
            onChange={(e) => handleNetworkChange(e.target.value)}
            className="form-select"
          >
            <option value="" disabled>
              Select a Network
            </option>
            {Object.keys(config.networks).map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-group">
        <label className="form-label">
          Base Token Address : 
          <select
            type="text"
            value={baseToken || ''}
            onChange={(e) => setBaseToken(e.target.value)}
            className="form-select"
          >
            <option value="" disabled>
            Select a Token
            </option>
            {Object.keys(baseTokenConfig).map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-group">
        <label className="form-label">
          Quote Token Address:
          <select
            type="text"
            value={quoteToken || ''}
            onChange={(e) => setQuoteToken(e.target.value)}
            className="form-select"
          >
            <option value="" disabled>
            Select a Token
            </option>
            {Object.keys(quoteTokenConfig).map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="btn" onClick={fetchOrders}>
        Generate Depth Chart
      </button>
      <div id="scichart-root" className="chart-container" />
    </div>
  );
  
}

export default App;
