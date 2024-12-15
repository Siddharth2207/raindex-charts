import React, { useState } from 'react';
import {
  SciChartSurface,
  NumericAxis,
  XyDataSeries,
  FastMountainRenderableSeries,
  EAutoRange,
  ENumericFormat,
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

const interpreterV3Abi = [
  `function eval3(
      address store,
      uint256 namespace,
      bytes calldata bytecode,
      uint256 sourceIndex,
      uint256[][] calldata context,
      uint256[] calldata inputs
  ) external view returns (uint256[] calldata stack, uint256[] calldata writes)`
]

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
const ONE = '1000000000000000000'

function App() {
  const [orders, setOrders] = useState([]);
  const [network, setNetwork] = useState();
  const [networkProvider, setNetworkProvider] = useState();
  const [networkEndpoint, setNetworkEndpoint] = useState();
  const [baseToken, setBaseToken] = useState();
  const [quoteToken, setQuoteToken] = useState();

  function qualifyNamespace(stateNamespace, sender) {
      // Convert stateNamespace to a BigNumber and then to a 32-byte hex string
      let stateNamespaceHex = ethers.utils.hexZeroPad(
          ethers.BigNumber.from(stateNamespace).toHexString(),
          32
      );

      // Normalize sender address and convert to a 32-byte hex string
      let senderHex = ethers.utils.hexZeroPad(
          ethers.utils.getAddress(sender).toLowerCase(),
          32
      );

      // Concatenate the two 32-byte hex strings
      let data = ethers.utils.concat([stateNamespaceHex, senderHex]);

      // Compute the keccak256 hash of the concatenated data
      let qualifiedNamespace = ethers.utils.keccak256(data);

      // Return the hash
      return qualifiedNamespace;
  }

  function getContext() {
      return [
          [
              // base column
              '0','0'
          ],
          [
              // calling context column
              '0','0','0'
          ],
          [
              // calculateIO context column
              '0','0'
          ],
          [
              // input context column
              '0','0','0','0','0'
          ],
          [
              // output context column
              '0','0','0','0','0'
          ],
          [
              // empty context column
              '0'
          ],
          [
              '0'
          ]
      ];
  }

  async function validateHandleIO(currentOrder, inputIOIndex, outputIOIndex, buyAmountFp18, buyOrderRatioFp18){
    const currentDecodedOrder = ethers.utils.defaultAbiCoder.decode([OrderV3], currentOrder.orderBytes)[0];
    
    const orderbookAddress = currentOrder.orderbook.id;

    const takerAddress = ethers.Wallet.createRandom().address

    let context = getContext()
    context[0][0] = takerAddress
    context[0][1] = orderbookAddress

    context[1][0] = currentOrder.orderHash
    context[1][1] = currentOrder.owner
    context[1][2] = takerAddress

    context[2][0] = buyAmountFp18
    context[2][1] = buyOrderRatioFp18

    context[3][0] = currentDecodedOrder.validInputs[inputIOIndex].token.toString()
    context[3][1] = ethers.BigNumber.from(currentDecodedOrder.validInputs[inputIOIndex].decimals.toString()).mul(ONE).toString()
    context[3][2] = currentDecodedOrder.validInputs[inputIOIndex].vaultId.toString()
    context[3][3] = ethers.BigNumber.from(
        currentOrder.inputs.filter((input) => {
            return (
                input.token.address.toLowerCase() === currentDecodedOrder.validInputs[inputIOIndex].token.toLowerCase() &&
                input.token.decimals.toString() === currentDecodedOrder.validInputs[inputIOIndex].decimals.toString() &&
                input.vaultId.toString() === currentDecodedOrder.validInputs[inputIOIndex].vaultId.toString() 
            )
        })[0].balance.toString()
    ).mul(ethers.BigNumber.from('1'+'0'.repeat(18-Number(currentDecodedOrder.validInputs[inputIOIndex].decimals)))).toString()
    context[3][4] = ethers.BigNumber.from(buyOrderRatioFp18).mul(ethers.BigNumber.from(buyAmountFp18)).div(ethers.BigNumber.from(ONE)).toString()

    context[4][0] = currentDecodedOrder.validOutputs[outputIOIndex].token.toString()
    context[4][1] = ethers.BigNumber.from(currentDecodedOrder.validOutputs[outputIOIndex].decimals.toString()).mul(ONE).toString()
    context[4][2] = currentDecodedOrder.validOutputs[outputIOIndex].vaultId.toString()
    context[4][3] = ethers.BigNumber.from(
        currentOrder.outputs.filter((output) => {
            return (
                output.token.address.toLowerCase() === currentDecodedOrder.validOutputs[outputIOIndex].token.toLowerCase() &&
                output.token.decimals.toString() === currentDecodedOrder.validOutputs[outputIOIndex].decimals.toString() &&
                output.vaultId.toString() === currentDecodedOrder.validOutputs[outputIOIndex].vaultId.toString() 
            )
        })[0].balance.toString()
    ).mul(ethers.BigNumber.from('1'+'0'.repeat(18-Number(currentDecodedOrder.validOutputs[outputIOIndex].decimals)))).toString()
    context[4][4] = buyAmountFp18

    const interpreterContract = new ethers.Contract(currentDecodedOrder.evaluable.interpreter, interpreterV3Abi, networkProvider);  

    let validHandleIO = false 
    try{
        const handleIOStack = await interpreterContract.eval3(
            currentDecodedOrder.evaluable.store,
            ethers.BigNumber.from(qualifyNamespace(currentDecodedOrder.owner,orderbookAddress)).toString(),
            currentDecodedOrder.evaluable.bytecode,
            '1', // Handle IO source index is 1
            context,
            []
        );
        validHandleIO = true
    }catch(e){
      console.log(`HandleIO Eval failed for order ${currentOrder.orderHash} : ${e.reason} `)
    }

    return validHandleIO
  }


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
          
          const currentOutputVault = currentOrder.outputs.filter((output) => {
              return (
                  output.token.address.toLowerCase() === currentDecodedOrder.validOutputs[buyOutputIndex].token.toLowerCase() &&
                  output.token.decimals.toString() === currentDecodedOrder.validOutputs[buyOutputIndex].decimals.toString() &&
                  output.vaultId.toString() === currentDecodedOrder.validOutputs[buyOutputIndex].vaultId.toString() 
              )
          })[0]
          const outputTokenSymbol = currentOutputVault.token.symbol.toUpperCase()
          const outputTokenBalance = ethers.utils.formatUnits(currentOutputVault.balance.toString(),currentOutputVault.token.decimals)
    
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
          
          const buyAmountFp18 = decodedBuyQuote[1].toString();
          const buyOrderRatioFp18 = decodedBuyQuote[2].toString();  
          const buyAmount = decodedBuyQuote[1].toString() / 1e18;
          const buyOrderRatio = decodedBuyQuote[2].toString() / 1e18;

          const isHandleIOValid = await validateHandleIO(currentOrder,buyInputIndex,buyOutputIndex,buyAmountFp18,buyOrderRatioFp18)
          if(isHandleIOValid){
            combinedOrders.push({
              orderHash: currentOrder.orderHash,
              side: 'buy',
              ioRatio: 1 / buyOrderRatio,
              outputAmount: buyAmount * buyOrderRatio,
              outputTokenSymbol,
              outputTokenBalance
            });
          }
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

          const currentOutputVault = currentOrder.outputs.filter((output) => {
              return (
                  output.token.address.toLowerCase() === currentDecodedOrder.validOutputs[sellOutputIndex].token.toLowerCase() &&
                  output.token.decimals.toString() === currentDecodedOrder.validOutputs[sellOutputIndex].decimals.toString() &&
                  output.vaultId.toString() === currentDecodedOrder.validOutputs[sellOutputIndex].vaultId.toString() 
              )
          })[0]
          const outputTokenSymbol = currentOutputVault.token.symbol.toUpperCase()
          const outputTokenBalance = ethers.utils.formatUnits(currentOutputVault.balance.toString(),currentOutputVault.token.decimals)

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
          
          const sellAmountFp18 = decodedSellQuote[1].toString();
          const sellOrderRatioFp18 = decodedSellQuote[2].toString();  
          const sellAmount = decodedSellQuote[1].toString() / 1e18;
          const sellOrderRatio = decodedSellQuote[2].toString() / 1e18;
          const isHandleIOValid = await validateHandleIO(currentOrder,sellInputIndex,sellOutputIndex,sellAmountFp18,sellOrderRatioFp18)
          
          if(isHandleIOValid){
            combinedOrders.push({
              orderHash: currentOrder.orderHash,
              side: 'sell',
              ioRatio: sellOrderRatio,
              outputAmount: sellAmount,
              outputTokenSymbol,
              outputTokenBalance
            });
          }

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
        // labelFormat: ENumericFormat.Engineering,
        cursorLabelFormat: ENumericFormat.Decimal,
      })
    );
    sciChartSurface.yAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: `${baseToken.toUpperCase()} Cumulative Quantity`,
        autoRange: EAutoRange.Always,
        labelPrecision: 6,
        labelFormat: ENumericFormat.Engineering,
        cursorLabelFormat: ENumericFormat.Decimal,
      })
    );
  
    // Add the chart title using TextAnnotation
    sciChartSurface.annotations.add(
      new TextAnnotation({
        text: "TFT-BUSD Raindex Market Depth Chart",
        fontSize: 24,
        textColor: "white",
        x1: 0.5,
        y1: 1,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        verticalAnchorPoint: EVerticalAnchorPoint.Top,
        xCoordinateMode: "Relative",
        yCoordinateMode: "Relative",
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
      {orders.length > 0 && (
      <div className="order-summary">
        <p>
          <span className="highlight">Total Orders:</span> {orders.length}
        </p>
        {/* Dynamic Token Balances */}
        <div className="token-balances">
          {Object.entries(
            orders.reduce((acc, order) => {
              // Accumulate balances for each token symbol
              const { outputTokenSymbol, outputTokenBalance } = order;
              acc[outputTokenSymbol] =
                (acc[outputTokenSymbol] || 0) +
                parseFloat(outputTokenBalance); // Sum balances
              return acc;
            }, {})
          ).map(([token, balance]) => (
            <p key={token} className="token-balance">
              <span className="highlight">{token} Balance:</span>{" "}
              {Number(balance).toLocaleString()} {/* Formatted balance */}
            </p>
          ))}
        </div>
      </div>
    )}
    </div>
  );
  
}

export default App;
