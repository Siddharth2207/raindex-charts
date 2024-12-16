import { ethers } from 'ethers';

export const IO = "(address token, uint8 decimals, uint256 vaultId)";
export const EvaluableV3 = "(address interpreter, address store, bytes bytecode)";
export const SignedContextV1 = "(address signer, uint256[] context, bytes signature)";
export const OrderV3 = `(address owner, ${EvaluableV3} evaluable, ${IO}[] validInputs, ${IO}[] validOutputs, bytes32 nonce)`;
export const TakeOrderConfigV3 = `(${OrderV3} order, uint256 inputIOIndex, uint256 outputIOIndex, ${SignedContextV1}[] signedContext)`;
export const QuoteConfig = TakeOrderConfigV3;

// Configuration for networks and subgraphs
export const config = {
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

export const baseTokenConfig = {
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

export const quoteTokenConfig = {
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

export const orderbookAbi = [
  `function quote(${QuoteConfig} calldata quoteConfig) external view returns (bool exists, uint256 outputMax, uint256 ioRatio)`
];

export const interpreterV3Abi = [
  `function eval3(
      address store,
      uint256 namespace,
      bytes calldata bytecode,
      uint256 sourceIndex,
      uint256[][] calldata context,
      uint256[] calldata inputs
  ) external view returns (uint256[] calldata stack, uint256[] calldata writes)`
]

export const orderQuery = `query OrdersListQuery($skip: Int = 0, $first: Int = 1000) {
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
export const ONE = '1000000000000000000'

export function qualifyNamespace(stateNamespace, sender) {
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

export function getContext() {
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