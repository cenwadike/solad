"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AILayer: () => AILayer,
  AILayerTestnet: () => AILayerTestnet,
  Ancient8: () => Ancient8,
  Ancient8Testnet: () => Ancient8Testnet,
  ArbitrumNova: () => ArbitrumNova,
  ArbitrumOne: () => ArbitrumOne,
  ArbitrumSepolia: () => ArbitrumSepolia,
  AstarzkEVMMainet: () => AstarzkEVMMainet,
  AstarzkEVMTestnet: () => AstarzkEVMTestnet,
  Aura: () => Aura,
  AuraTestnet: () => AuraTestnet,
  Aurora: () => Aurora,
  AuroraTestnet: () => AuroraTestnet,
  Avalanche: () => Avalanche,
  AvalancheTestnet: () => AvalancheTestnet,
  BEVM: () => BEVM,
  BEVMCanary: () => BEVMCanary,
  BEVMCanaryTestnet: () => BEVMCanaryTestnet,
  BEVMTestnet: () => BEVMTestnet,
  BNBChain: () => BNBChain,
  BNBChainTestnet: () => BNBChainTestnet,
  BOB: () => BOB,
  BOBTestnet: () => BOBTestnet,
  BSquared: () => BSquared,
  BSquaredTestnet: () => BSquaredTestnet,
  Base: () => Base,
  BaseSepolia: () => BaseSepolia,
  Berachain: () => Berachain,
  BerachainbArtio: () => BerachainbArtio,
  Bitlayer: () => Bitlayer,
  BitlayerTestnet: () => BitlayerTestnet,
  Blast: () => Blast,
  BlastSepolia: () => BlastSepolia,
  BotanixTestnet: () => BotanixTestnet,
  Celo: () => Celo,
  CeloTestnet: () => CeloTestnet,
  Combo: () => Combo,
  ComboTestnet: () => ComboTestnet,
  ConfluxeSpace: () => ConfluxeSpace,
  ConfluxeSpaceTestnet: () => ConfluxeSpaceTestnet,
  Core: () => Core,
  CoreTestnet: () => CoreTestnet,
  Cronos: () => Cronos,
  CronosTestnet: () => CronosTestnet,
  Cyber: () => Cyber,
  CyberTestnet: () => CyberTestnet,
  DODOChainTestnet: () => DODOChainTestnet,
  Duckchain: () => Duckchain,
  DuckchainTestnet: () => DuckchainTestnet,
  EOSEVM: () => EOSEVM,
  EOSEVMTestnet: () => EOSEVMTestnet,
  Elastos: () => Elastos,
  Ethereum: () => Ethereum,
  EthereumHolesky: () => EthereumHolesky,
  EthereumSepolia: () => EthereumSepolia,
  Fantom: () => Fantom,
  FantomTestnet: () => FantomTestnet,
  Fuse: () => Fuse,
  FuseTestnet: () => FuseTestnet,
  GMNetwork: () => GMNetwork,
  GOATNetwork: () => GOATNetwork,
  GOATTestnet3: () => GOATTestnet3,
  Gnosis: () => Gnosis,
  GnosisTestnet: () => GnosisTestnet,
  Gravity: () => Gravity,
  GravityTestnet: () => GravityTestnet,
  Harmony: () => Harmony,
  HarmonyTestnet: () => HarmonyTestnet,
  HashKeyChain: () => HashKeyChain,
  HashKeyChainTestnet: () => HashKeyChainTestnet,
  HybridTestnet: () => HybridTestnet,
  ImmutablezkEVMTestnet: () => ImmutablezkEVMTestnet,
  IoTeX: () => IoTeX,
  IoTeXTestnet: () => IoTeXTestnet,
  KCC: () => KCC,
  KCCTestnet: () => KCCTestnet,
  KakarotSepolia: () => KakarotSepolia,
  Kava: () => Kava,
  KavaTestnet: () => KavaTestnet,
  Klaytn: () => Klaytn,
  KlaytnTestnet: () => KlaytnTestnet,
  Linea: () => Linea,
  LineaSepolia: () => LineaSepolia,
  Lorenzo: () => Lorenzo,
  LorenzoTestnet: () => LorenzoTestnet,
  LumiaTestnet: () => LumiaTestnet,
  MAPProtocol: () => MAPProtocol,
  MAPProtocolTestnet: () => MAPProtocolTestnet,
  Manta: () => Manta,
  MantaSepolia: () => MantaSepolia,
  Mantle: () => Mantle,
  MantleSepoliaTestnet: () => MantleSepoliaTestnet,
  Merlin: () => Merlin,
  MerlinTestnet: () => MerlinTestnet,
  Metis: () => Metis,
  Mode: () => Mode,
  ModeTestnet: () => ModeTestnet,
  Moonbeam: () => Moonbeam,
  MoonbeamTestnet: () => MoonbeamTestnet,
  Moonriver: () => Moonriver,
  MovementDevnet: () => MovementDevnet,
  OKTC: () => OKTC,
  OKTCTestnet: () => OKTCTestnet,
  OasisEmerald: () => OasisEmerald,
  OasisEmeraldTestnet: () => OasisEmeraldTestnet,
  Optimism: () => Optimism,
  OptimismSepolia: () => OptimismSepolia,
  ParticleChains: () => ParticleChains,
  Peaq: () => Peaq,
  PeaqAgungTestnet: () => PeaqAgungTestnet,
  PeaqKrest: () => PeaqKrest,
  PlatON: () => PlatON,
  PlatONTestnet: () => PlatONTestnet,
  PlumeTestnet: () => PlumeTestnet,
  Polygon: () => Polygon,
  PolygonAmoy: () => PolygonAmoy,
  PolygonzkEVM: () => PolygonzkEVM,
  PolygonzkEVMCardona: () => PolygonzkEVMCardona,
  ReadONTestnet: () => ReadONTestnet,
  SKALENebula: () => SKALENebula,
  SatoshiVMAlpha: () => SatoshiVMAlpha,
  SatoshiVMTestnet: () => SatoshiVMTestnet,
  Scroll: () => Scroll,
  ScrollSepolia: () => ScrollSepolia,
  Sei: () => Sei,
  SeiDevnet: () => SeiDevnet,
  SeiTestnet: () => SeiTestnet,
  Solana: () => Solana,
  SolanaDevnet: () => SolanaDevnet,
  SolanaTestnet: () => SolanaTestnet,
  SoneiumMinatoTestnet: () => SoneiumMinatoTestnet,
  StoryTestnet: () => StoryTestnet,
  TUNATestnet: () => TUNATestnet,
  Taiko: () => Taiko,
  TaikoHekla: () => TaikoHekla,
  ThunderCore: () => ThunderCore,
  ThunderCoreTestnet: () => ThunderCoreTestnet,
  Tron: () => Tron,
  TronNile: () => TronNile,
  TronShasta: () => TronShasta,
  Viction: () => Viction,
  VictionTestnet: () => VictionTestnet,
  XLayer: () => XLayer,
  XLayerTestnet: () => XLayerTestnet,
  XterioBNB: () => XterioBNB,
  XterioBNBTestnet: () => XterioBNBTestnet,
  XterioETH: () => XterioETH,
  ZKFair: () => ZKFair,
  ZKFairTestnet: () => ZKFairTestnet,
  Zeroone: () => Zeroone,
  ZerooneTestnet: () => ZerooneTestnet,
  ZetaChain: () => ZetaChain,
  ZetaChainTestnet: () => ZetaChainTestnet,
  ZircuitTestnet: () => ZircuitTestnet,
  Zora: () => Zora,
  chains: () => utils_exports,
  fiveire: () => fiveire,
  fiveireTestnet: () => fiveireTestnet,
  opBNB: () => opBNB,
  opBNBTestnet: () => opBNBTestnet,
  zkLinkNova: () => zkLinkNova,
  zkSyncEra: () => zkSyncEra,
  zkSyncEraSepolia: () => zkSyncEraSepolia
});
module.exports = __toCommonJS(src_exports);

// src/data.ts
var Ethereum = {
  id: 1,
  name: "Ethereum",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/ethereum/native.png",
  nativeIcon: "",
  fullname: "Ethereum Mainnet",
  network: "Mainnet",
  website: "https://ethereum.org",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://ethereum.publicnode.com",
  blockExplorerUrl: "https://etherscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "LIGHT",
          version: "1.0.2"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var Optimism = {
  id: 10,
  name: "Optimism",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/optimism/native.png",
  nativeIcon: "",
  fullname: "Optimism Mainnet",
  network: "Mainnet",
  website: "https://optimism.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://mainnet.optimism.io",
  blockExplorerUrl: "https://optimistic.etherscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "LIGHT",
          version: "1.0.2"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var ThunderCoreTestnet = {
  id: 18,
  name: "ThunderCore",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/thundercore/native.png",
  nativeIcon: "",
  fullname: "ThunderCore Testnet",
  network: "Testnet",
  website: "https://thundercore.com",
  nativeCurrency: {
    name: "ThunderCore Token",
    symbol: "TT",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.thundercore.com",
  faucetUrl: "https://faucet-testnet.thundercore.com",
  blockExplorerUrl: "https://explorer-testnet.thundercore.com"
};
var Elastos = {
  id: 20,
  name: "Elastos",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/elastos/native.png",
  nativeIcon: "",
  fullname: "Elastos Mainnet",
  network: "Mainnet",
  website: "https://elastos.org",
  nativeCurrency: {
    name: "ELA",
    symbol: "ELA",
    decimals: 18
  },
  rpcUrl: "https://api.elastos.io/esc",
  blockExplorerUrl: "https://esc.elastos.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Cronos = {
  id: 25,
  name: "Cronos",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/cronos/native.png",
  nativeIcon: "",
  fullname: "Cronos Mainnet",
  network: "Mainnet",
  website: "https://cronos.org",
  nativeCurrency: {
    name: "Cronos",
    symbol: "CRO",
    decimals: 18
  },
  rpcUrl: "https://evm.cronos.org",
  blockExplorerUrl: "https://cronoscan.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "SWAP"
    }
  ]
};
var BNBChain = {
  id: 56,
  name: "BSC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bsc/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "BNB Chain",
  network: "Mainnet",
  website: "https://www.bnbchain.org/en",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://bsc-dataseed1.binance.org",
  blockExplorerUrl: "https://bscscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var OKTCTestnet = {
  id: 65,
  name: "OKC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/okc/native.png",
  nativeIcon: "",
  fullname: "OKTC Testnet",
  network: "Testnet",
  website: "https://www.okex.com/okexchain",
  nativeCurrency: {
    name: "OKT",
    symbol: "OKT",
    decimals: 18
  },
  rpcUrl: "https://exchaintestrpc.okex.org",
  faucetUrl: "https://docs.oxdex.com/v/en/help/gitter",
  blockExplorerUrl: "https://www.oklink.com/okc-test"
};
var OKTC = {
  id: 66,
  name: "OKC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/okc/native.png",
  nativeIcon: "",
  fullname: "OKTC Mainnet",
  network: "Mainnet",
  website: "https://www.okex.com/okc",
  nativeCurrency: {
    name: "OKT",
    symbol: "OKT",
    decimals: 18
  },
  rpcUrl: "https://exchainrpc.okex.org",
  blockExplorerUrl: "https://www.oklink.com/okc",
  features: [
    {
      name: "SWAP"
    }
  ]
};
var ConfluxeSpaceTestnet = {
  id: 71,
  name: "ConfluxESpace",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/confluxespace/native.png",
  nativeIcon: "",
  fullname: "Conflux eSpace Testnet",
  network: "Testnet",
  website: "https://confluxnetwork.org",
  nativeCurrency: {
    name: "CFX",
    symbol: "CFX",
    decimals: 18
  },
  rpcUrl: "https://evmtestnet.confluxrpc.com",
  faucetUrl: "https://efaucet.confluxnetwork.org",
  blockExplorerUrl: "https://evmtestnet.confluxscan.net"
};
var Viction = {
  id: 88,
  name: "Viction",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/viction/native.png",
  nativeIcon: "",
  fullname: "Viction Mainnet",
  network: "Mainnet",
  website: "https://tomochain.com",
  nativeCurrency: {
    name: "Viction",
    symbol: "VIC",
    decimals: 18
  },
  rpcUrl: "https://rpc.viction.xyz",
  blockExplorerUrl: "https://vicscan.xyz",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var VictionTestnet = {
  id: 89,
  name: "Viction",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/viction/native.png",
  nativeIcon: "",
  fullname: "Viction Testnet",
  network: "Testnet",
  website: "https://tomochain.com",
  nativeCurrency: {
    name: "Viction",
    symbol: "VIC",
    decimals: 18
  },
  rpcUrl: "https://rpc-testnet.viction.xyz",
  blockExplorerUrl: "https://testnet.vicscan.xyz",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BNBChainTestnet = {
  id: 97,
  name: "BSC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bsc/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "BNB Chain Testnet",
  network: "Testnet",
  website: "https://www.bnbchain.org/en",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  blockExplorerUrl: "https://testnet.bscscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    }
  ]
};
var Gnosis = {
  id: 100,
  name: "Gnosis",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/gnosis/native.png",
  nativeIcon: "",
  fullname: "Gnosis Mainnet",
  network: "Mainnet",
  website: "https://docs.gnosischain.com",
  nativeCurrency: {
    name: "Gnosis",
    symbol: "XDAI",
    decimals: 18
  },
  rpcUrl: "https://rpc.ankr.com/gnosis",
  blockExplorerUrl: "https://gnosisscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var Solana = {
  id: 101,
  name: "Solana",
  chainType: "solana",
  icon: "https://static.particle.network/token-list/solana/native.png",
  nativeIcon: "",
  fullname: "Solana Mainnet",
  network: "Mainnet",
  website: "https://solana.com",
  nativeCurrency: {
    name: "SOL",
    symbol: "SOL",
    decimals: 9
  },
  rpcUrl: "https://api.mainnet-beta.solana.com",
  blockExplorerUrl: "https://solscan.io",
  features: [
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var SolanaTestnet = {
  id: 102,
  name: "Solana",
  chainType: "solana",
  icon: "https://static.particle.network/token-list/solana/native.png",
  nativeIcon: "",
  fullname: "Solana Testnet",
  network: "Testnet",
  website: "https://solana.com",
  nativeCurrency: {
    name: "SOL",
    symbol: "SOL",
    decimals: 9
  },
  rpcUrl: "https://api.testnet.solana.com",
  faucetUrl: "https://solfaucet.com",
  blockExplorerUrl: "https://solscan.io"
};
var SolanaDevnet = {
  id: 103,
  name: "Solana",
  chainType: "solana",
  icon: "https://static.particle.network/token-list/solana/native.png",
  nativeIcon: "",
  fullname: "Solana Devnet",
  network: "Devnet",
  website: "https://solana.com",
  nativeCurrency: {
    name: "SOL",
    symbol: "SOL",
    decimals: 9
  },
  rpcUrl: "https://api.devnet.solana.com",
  faucetUrl: "https://solfaucet.com",
  blockExplorerUrl: "https://solscan.io"
};
var ThunderCore = {
  id: 108,
  name: "ThunderCore",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/thundercore/native.png",
  nativeIcon: "",
  fullname: "ThunderCore Mainnet",
  network: "Mainnet",
  website: "https://thundercore.com",
  nativeCurrency: {
    name: "ThunderCore Token",
    symbol: "TT",
    decimals: 18
  },
  rpcUrl: "https://mainnet-rpc.thundercore.com",
  blockExplorerUrl: "https://viewblock.io/thundercore"
};
var BOBTestnet = {
  id: 111,
  name: "BOB",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bob/native.png",
  nativeIcon: "",
  fullname: "BOB Testnet",
  network: "Testnet",
  website: "https://www.gobob.xyz",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://testnet.rpc.gobob.xyz",
  blockExplorerUrl: "https://testnet-explorer.gobob.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Fuse = {
  id: 122,
  name: "fuse",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/fuse/native.png",
  nativeIcon: "",
  fullname: "Fuse Mainnet",
  network: "Mainnet",
  website: "https://www.fuse.io",
  nativeCurrency: {
    name: "FUSE",
    symbol: "FUSE",
    decimals: 18
  },
  rpcUrl: "https://rpc.fuse.io",
  blockExplorerUrl: "https://explorer.fuse.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var FuseTestnet = {
  id: 123,
  name: "fuse",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/fuse/native.png",
  nativeIcon: "",
  fullname: "Fuse Testnet",
  network: "Testnet",
  website: "https://www.fuse.io",
  nativeCurrency: {
    name: "FUSE",
    symbol: "FUSE",
    decimals: 18
  },
  rpcUrl: "https://rpc.fusespark.io",
  blockExplorerUrl: "https://explorer.fusespark.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var HashKeyChainTestnet = {
  id: 133,
  name: "hsk",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/hsk/native.png",
  nativeIcon: "",
  fullname: "HashKey Chain Testnet",
  network: "Testnet",
  website: "https://group.hashkey.com/",
  nativeCurrency: {
    name: "HSK",
    symbol: "HSK",
    decimals: 18
  },
  rpcUrl: "https://hashkeychain-testnet.alt.technology",
  blockExplorerUrl: "https://hashkeychain-testnet-explorer.alt.technology",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Polygon = {
  id: 137,
  name: "Polygon",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/polygon/native.png",
  nativeIcon: "",
  fullname: "Polygon Mainnet",
  network: "Mainnet",
  website: "https://polygon.technology",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  rpcUrl: "https://polygon-rpc.com",
  blockExplorerUrl: "https://polygonscan.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "LIGHT",
          version: "1.0.2"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var Manta = {
  id: 169,
  name: "Manta",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/manta/native.png",
  nativeIcon: "",
  fullname: "Manta Mainnet",
  network: "Mainnet",
  website: "https://manta.network",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://pacific-rpc.manta.network/http",
  blockExplorerUrl: "https://pacific-explorer.manta.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var HashKeyChain = {
  id: 177,
  name: "hsk",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/hsk/native.png",
  nativeIcon: "",
  fullname: "HashKey Chain Mainnet",
  network: "Mainnet",
  website: "https://group.hashkey.com/",
  nativeCurrency: {
    name: "HSK",
    symbol: "HSK",
    decimals: 18
  },
  rpcUrl: "https://mainnet.hsk.xyz",
  blockExplorerUrl: "https://explorer.hsk.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var XLayerTestnet = {
  id: 195,
  name: "OKBC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/okc/native.png",
  nativeIcon: "",
  fullname: "X Layer Testnet",
  network: "Testnet",
  website: "https://www.okx.com",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18
  },
  rpcUrl: "https://testrpc.xlayer.tech",
  blockExplorerUrl: "https://www.okx.com/explorer/xlayer-test",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var XLayer = {
  id: 196,
  name: "OKBC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/okc/native.png",
  nativeIcon: "",
  fullname: "X Layer Mainnet",
  network: "Mainnet",
  website: "https://www.okx.com",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18
  },
  rpcUrl: "https://rpc.xlayer.tech",
  blockExplorerUrl: "https://www.okx.com/zh-hans/explorer/xlayer",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var opBNB = {
  id: 204,
  name: "opBNB",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/opbnb/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "opBNB Mainnet",
  network: "Mainnet",
  website: "https://opbnb.bnbchain.org",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://opbnb-mainnet-rpc.bnbchain.org",
  blockExplorerUrl: "https://mainnet.opbnbscan.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        }
      ]
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var MAPProtocolTestnet = {
  id: 212,
  name: "MAPProtocol",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/mapprotocol/native.png",
  nativeIcon: "",
  fullname: "MAP Protocol Testnet",
  network: "Testnet",
  website: "https://maplabs.io",
  nativeCurrency: {
    name: "MAPO",
    symbol: "MAPO",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.maplabs.io",
  faucetUrl: "https://faucet.mapprotocol.io",
  blockExplorerUrl: "https://testnet.maposcan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BSquared = {
  id: 223,
  name: "BSquared",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bsquared/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "B\xB2 Network Mainnet",
  network: "Mainnet",
  website: "https://www.bsquared.network",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc.bsquared.network",
  blockExplorerUrl: "https://explorer.bsquared.network",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Fantom = {
  id: 250,
  name: "Fantom",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/fantom/native.png",
  nativeIcon: "",
  fullname: "Fantom Mainnet",
  network: "Mainnet",
  website: "https://fantom.foundation",
  nativeCurrency: {
    name: "FTM",
    symbol: "FTM",
    decimals: 18
  },
  rpcUrl: "https://rpc.ftm.tools",
  blockExplorerUrl: "https://ftmscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var zkSyncEraSepolia = {
  id: 300,
  name: "zkSync",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zksync/native.png",
  nativeIcon: "",
  fullname: "zkSync Era Sepolia",
  network: "Sepolia",
  website: "https://era.zksync.io",
  nativeCurrency: {
    name: "zkSync",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia.era.zksync.dev",
  faucetUrl: "https://portal.zksync.io/faucet",
  blockExplorerUrl: "https://sepolia.explorer.zksync.io",
  features: [
    {
      name: "EIP1559"
    }
  ]
};
var KCC = {
  id: 321,
  name: "KCC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/kcc/native.png",
  nativeIcon: "",
  fullname: "KCC Mainnet",
  network: "Mainnet",
  website: "https://kcc.io",
  nativeCurrency: {
    name: "KCS",
    symbol: "KCS",
    decimals: 18
  },
  rpcUrl: "https://rpc-mainnet.kcc.network",
  blockExplorerUrl: "https://explorer.kcc.io/en"
};
var KCCTestnet = {
  id: 322,
  name: "KCC",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/kcc/native.png",
  nativeIcon: "",
  fullname: "KCC Testnet",
  network: "Testnet",
  website: "https://scan-testnet.kcc.network",
  nativeCurrency: {
    name: "KCS",
    symbol: "KCS",
    decimals: 18
  },
  rpcUrl: "https://rpc-testnet.kcc.network",
  faucetUrl: "https://faucet-testnet.kcc.network",
  blockExplorerUrl: "https://scan-testnet.kcc.network"
};
var zkSyncEra = {
  id: 324,
  name: "zkSync",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zksync/native.png",
  nativeIcon: "",
  fullname: "zkSync Era",
  network: "Mainnet",
  website: "https://zksync.io",
  nativeCurrency: {
    name: "zkSync",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://zksync2-mainnet.zksync.io",
  blockExplorerUrl: "https://explorer.zksync.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var CronosTestnet = {
  id: 338,
  name: "Cronos",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/cronos/native.png",
  nativeIcon: "",
  fullname: "Cronos Testnet",
  network: "Testnet",
  website: "https://cronos.org",
  nativeCurrency: {
    name: "Cronos",
    symbol: "CRO",
    decimals: 18
  },
  rpcUrl: "https://evm-t3.cronos.org",
  faucetUrl: "https://cronos.org/faucet",
  blockExplorerUrl: "https://testnet.cronoscan.com",
  features: [
    {
      name: "EIP1559"
    }
  ]
};
var ModeTestnet = {
  id: 919,
  name: "Mode",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/mode/native.png",
  nativeIcon: "",
  fullname: "Mode Testnet",
  network: "Testnet",
  website: "https://www.mode.network",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia.mode.network",
  blockExplorerUrl: "https://sepolia.explorer.mode.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var fiveire = {
  id: 995,
  name: "fiveire",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/fiveire/native.png",
  nativeIcon: "",
  fullname: "5ire Mainnet",
  network: "Mainnet",
  website: "https://www.5ire.org",
  nativeCurrency: {
    name: "5IRE",
    symbol: "5IRE",
    decimals: 18
  },
  rpcUrl: "https://rpc.5ire.network",
  blockExplorerUrl: "https://5irescan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var fiveireTestnet = {
  id: 997,
  name: "fiveire",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/fiveire/native.png",
  nativeIcon: "",
  fullname: "5ire Testnet",
  network: "Testnet",
  website: "https://www.5ire.org",
  nativeCurrency: {
    name: "5IRE",
    symbol: "5IRE",
    decimals: 18
  },
  rpcUrl: "https://rpc.qa.5ire.network",
  blockExplorerUrl: "https://scan.qa.5ire.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var KlaytnTestnet = {
  id: 1001,
  name: "Klaytn",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/klaytn/native.png",
  nativeIcon: "",
  fullname: "Klaytn Testnet",
  network: "Testnet",
  website: "https://www.klaytn.com",
  nativeCurrency: {
    name: "Klaytn",
    symbol: "KLAY",
    decimals: 18
  },
  rpcUrl: "https://api.baobab.klaytn.net:8651",
  faucetUrl: "https://baobab.wallet.klaytn.foundation/faucet",
  blockExplorerUrl: "https://baobab.scope.klaytn.com"
};
var ConfluxeSpace = {
  id: 1030,
  name: "ConfluxESpace",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/confluxespace/native.png",
  nativeIcon: "",
  fullname: "Conflux eSpace",
  network: "Mainnet",
  website: "https://confluxnetwork.org",
  nativeCurrency: {
    name: "CFX",
    symbol: "CFX",
    decimals: 18
  },
  rpcUrl: "https://evm.confluxrpc.com",
  blockExplorerUrl: "https://evm.confluxscan.net",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    }
  ]
};
var Metis = {
  id: 1088,
  name: "Metis",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/metis/native.png",
  nativeIcon: "",
  fullname: "Metis Mainnet",
  network: "Mainnet",
  website: "https://www.metis.io",
  nativeCurrency: {
    name: "Metis",
    symbol: "METIS",
    decimals: 18
  },
  rpcUrl: "https://andromeda.metis.io/?owner=1088",
  blockExplorerUrl: "https://andromeda-explorer.metis.io"
};
var PolygonzkEVM = {
  id: 1101,
  name: "PolygonZkEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/polygonzkevm/native.png",
  nativeIcon: "",
  fullname: "Polygon zkEVM",
  network: "Mainnet",
  website: "https://polygon.technology/polygon-zkevm",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://zkevm-rpc.com",
  blockExplorerUrl: "https://zkevm.polygonscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var CoreTestnet = {
  id: 1115,
  name: "Core",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/core/native.png",
  nativeIcon: "",
  fullname: "Core Testnet",
  network: "Testnet",
  website: "https://coredao.org",
  nativeCurrency: {
    name: "CORE",
    symbol: "CORE",
    decimals: 18
  },
  rpcUrl: "https://rpc.test.btcs.network",
  blockExplorerUrl: "https://scan.test.btcs.network",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Core = {
  id: 1116,
  name: "Core",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/core/native.png",
  nativeIcon: "",
  fullname: "Core Mainnet",
  network: "Mainnet",
  website: "https://coredao.org",
  nativeCurrency: {
    name: "CORE",
    symbol: "CORE",
    decimals: 18
  },
  rpcUrl: "https://rpc.coredao.org",
  blockExplorerUrl: "https://scan.coredao.org",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BSquaredTestnet = {
  id: 1123,
  name: "BSquared",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bsquared/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "B\xB2 Network Testnet",
  network: "Testnet",
  website: "https://www.bsquared.network",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://b2-testnet.alt.technology",
  blockExplorerUrl: "https://testnet-explorer.bsquared.network",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var HybridTestnet = {
  id: 1225,
  name: "Hybrid",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/hybrid/native.png",
  nativeIcon: "",
  fullname: "Hybrid Testnet",
  network: "Testnet",
  website: "https://buildonhybrid.com",
  nativeCurrency: {
    name: "HYB",
    symbol: "HYB",
    decimals: 18
  },
  rpcUrl: "https://hybrid-testnet.rpc.caldera.xyz/http",
  blockExplorerUrl: "https://explorer.buildonhybrid.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Moonbeam = {
  id: 1284,
  name: "Moonbeam",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/moonbeam/native.png",
  nativeIcon: "",
  fullname: "Moonbeam Mainnet",
  network: "Mainnet",
  website: "https://moonbeam.network/networks/moonbeam",
  nativeCurrency: {
    name: "GLMR",
    symbol: "GLMR",
    decimals: 18
  },
  rpcUrl: "https://rpc.api.moonbeam.network",
  blockExplorerUrl: "https://moonbeam.moonscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var Moonriver = {
  id: 1285,
  name: "Moonriver",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/moonriver/native.png",
  nativeIcon: "",
  fullname: "Moonriver Mainnet",
  network: "Mainnet",
  website: "https://moonbeam.network/networks/moonriver",
  nativeCurrency: {
    name: "MOVR",
    symbol: "MOVR",
    decimals: 18
  },
  rpcUrl: "https://rpc.api.moonriver.moonbeam.network",
  blockExplorerUrl: "https://moonriver.moonscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var MoonbeamTestnet = {
  id: 1287,
  name: "Moonbeam",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/moonbeam/native.png",
  nativeIcon: "",
  fullname: "Moonbeam Testnet",
  network: "Testnet",
  website: "https://docs.moonbeam.network/networks/testnet",
  nativeCurrency: {
    name: "Dev",
    symbol: "DEV",
    decimals: 18
  },
  rpcUrl: "https://rpc.api.moonbase.moonbeam.network",
  faucetUrl: "https://apps.moonbeam.network/moonbase-alpha/faucet",
  blockExplorerUrl: "https://moonbase.moonscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var SeiTestnet = {
  id: 1328,
  name: "Sei",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/sei/native.png",
  nativeIcon: "",
  fullname: "Sei Testnet",
  network: "Testnet",
  website: "https://www.sei.io",
  nativeCurrency: {
    name: "SEI",
    symbol: "SEI",
    decimals: 18
  },
  rpcUrl: "https://evm-rpc-testnet.sei-apis.com",
  blockExplorerUrl: "https://testnet.seistream.app",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Sei = {
  id: 1329,
  name: "Sei",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/sei/native.png",
  nativeIcon: "",
  fullname: "Sei Mainnet",
  network: "Mainnet",
  website: "https://www.sei.io",
  nativeCurrency: {
    name: "SEI",
    symbol: "SEI",
    decimals: 18
  },
  rpcUrl: "https://evm-rpc.sei-apis.com",
  blockExplorerUrl: "https://seistream.app",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BEVMCanary = {
  id: 1501,
  name: "BEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bevm/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "BEVM Canary Mainnet",
  network: "Mainnet",
  website: "https://www.bevm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc-canary-1.bevm.io",
  blockExplorerUrl: "https://scan-canary.bevm.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BEVMCanaryTestnet = {
  id: 1502,
  name: "BEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bevm/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "BEVM Canary Testnet",
  network: "Testnet",
  website: "https://www.bevm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://canary-testnet.bevm.io",
  blockExplorerUrl: "https://scan-canary-testnet.bevm.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var StoryTestnet = {
  id: 1516,
  name: "StoryNetwork",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/storynetwork/native.png",
  nativeIcon: "",
  fullname: "Story Testnet",
  network: "Testnet",
  website: "https://www.story.foundation",
  nativeCurrency: {
    name: "IP",
    symbol: "IP",
    decimals: 18
  },
  rpcUrl: "https://odyssey.storyrpc.io",
  blockExplorerUrl: "https://odyssey-testnet-explorer.storyscan.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Gravity = {
  id: 1625,
  name: "Gravity",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/gravity/native.png",
  nativeIcon: "",
  fullname: "Gravity Mainnet",
  network: "Mainnet",
  website: "https://gravity.xyz",
  nativeCurrency: {
    name: "G",
    symbol: "G",
    decimals: 18
  },
  rpcUrl: "https://rpc.gravity.xyz",
  blockExplorerUrl: "https://gscan.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var ComboTestnet = {
  id: 1715,
  name: "Combo",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/combo/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "Combo Testnet",
  network: "Testnet",
  website: "https://docs.combonetwork.io",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://test-rpc.combonetwork.io",
  blockExplorerUrl: "https://combotrace-testnet.nodereal.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var SoneiumMinatoTestnet = {
  id: 1946,
  name: "Soneium",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/soneium/native.png",
  nativeIcon: "",
  fullname: "Soneium Minato Testnet",
  network: "Testnet",
  website: "https://soneium.org",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.minato.soneium.org",
  blockExplorerUrl: "https://explorer-testnet.soneium.org",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var KavaTestnet = {
  id: 2221,
  name: "Kava",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/kava/native.png",
  nativeIcon: "",
  fullname: "Kava Testnet",
  network: "Testnet",
  website: "https://www.kava.io",
  nativeCurrency: {
    name: "KAVA",
    symbol: "KAVA",
    decimals: 18
  },
  rpcUrl: "https://evm.testnet.kava.io",
  faucetUrl: "https://faucet.kava.io",
  blockExplorerUrl: "https://testnet.kavascan.com"
};
var Kava = {
  id: 2222,
  name: "Kava",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/kava/native.png",
  nativeIcon: "",
  fullname: "Kava Mainnet",
  network: "Mainnet",
  website: "https://www.kava.io",
  nativeCurrency: {
    name: "KAVA",
    symbol: "KAVA",
    decimals: 18
  },
  rpcUrl: "https://evm.kava.io",
  blockExplorerUrl: "https://kavascan.com"
};
var PeaqKrest = {
  id: 2241,
  name: "peaq",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/peaq/native.png",
  nativeIcon: "",
  fullname: "Peaq Krest Mainnet",
  network: "Mainnet",
  website: "https://www.peaq.network",
  nativeCurrency: {
    name: "KRST",
    symbol: "KRST",
    decimals: 18
  },
  rpcUrl: "https://erpc-krest.peaq.network",
  blockExplorerUrl: "https://krest.subscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var GOATNetwork = {
  id: 2345,
  name: "Goat",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/goat/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "GOAT Network",
  network: "Mainnet",
  website: "https://www.goat.network",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc.goat.network",
  blockExplorerUrl: "https://explorer.goat.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var PolygonzkEVMCardona = {
  id: 2442,
  name: "PolygonZkEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/polygonzkevm/native.png",
  nativeIcon: "",
  fullname: "Polygon zkEVM Cardona",
  network: "Cardona",
  website: "https://polygon.technology",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.cardona.zkevm-rpc.com",
  blockExplorerUrl: "https://cardona-zkevm.polygonscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var AILayerTestnet = {
  id: 2648,
  name: "ainn",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/ainn/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "AILayer Testnet",
  network: "Testnet",
  website: "https://anvm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc.anvm.io",
  blockExplorerUrl: "https://explorer.anvm.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var AILayer = {
  id: 2649,
  name: "ainn",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/ainn/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "AILayer Mainnet",
  network: "Mainnet",
  website: "https://anvm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://mainnet-rpc.ailayer.xyz",
  blockExplorerUrl: "https://mainnet-explorer.ailayer.xyz",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var GMNetwork = {
  id: 2777,
  name: "GMNetwork",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/gmnetwork/native.png",
  nativeIcon: "",
  fullname: "GM Network Mainnet",
  network: "Mainnet",
  website: "https://gmnetwork.ai",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.gmnetwork.ai",
  blockExplorerUrl: "https://scan.gmnetwork.ai",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var SatoshiVMAlpha = {
  id: 3109,
  name: "satoshivm",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/satoshivm/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "SatoshiVM Alpha",
  network: "Mainnet",
  website: "https://www.satoshivm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://alpha-rpc-node-http.svmscan.io",
  blockExplorerUrl: "https://svmscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var SatoshiVMTestnet = {
  id: 3110,
  name: "SatoshiVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/satoshivm/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "SatoshiVM Testnet",
  network: "Testnet",
  website: "https://www.satoshivm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://test-rpc-node-http.svmscan.io",
  blockExplorerUrl: "https://testnet.svmscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Peaq = {
  id: 3338,
  name: "peaq",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/peaq/native.png",
  nativeIcon: "",
  fullname: "Peaq Mainnet",
  network: "Mainnet",
  website: "https://peaq.subscan.io",
  nativeCurrency: {
    name: "PEAQ",
    symbol: "PEAQ",
    decimals: 18
  },
  rpcUrl: " https://evm.peaq.network",
  blockExplorerUrl: "https://peaq.subscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BotanixTestnet = {
  id: 3636,
  name: "Botanix",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/botanix/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "Botanix Testnet",
  network: "Testnet",
  website: "https://botanixlabs.xyz",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://node.botanixlabs.dev",
  blockExplorerUrl: "https://blockscout.botanixlabs.dev",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var AstarzkEVMMainet = {
  id: 3776,
  name: "AstarZkEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/astarzkevm/native.png",
  nativeIcon: "",
  fullname: "Astar zkEVM Mainet",
  network: "Mainnet",
  website: "https://astar.network",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.startale.com/astar-zkevm",
  blockExplorerUrl: "https://astar-zkevm.explorer.startale.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var FantomTestnet = {
  id: 4002,
  name: "Fantom",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/fantom/native.png",
  nativeIcon: "",
  fullname: "Fantom Testnet",
  network: "Testnet",
  website: "https://docs.fantom.foundation/quick-start/short-guide#fantom-testnet",
  nativeCurrency: {
    name: "FTM",
    symbol: "FTM",
    decimals: 18
  },
  rpcUrl: "https://rpc.testnet.fantom.network",
  faucetUrl: "https://faucet.fantom.network",
  blockExplorerUrl: "https://testnet.ftmscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Merlin = {
  id: 4200,
  name: "Merlin",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/merlin/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "Merlin Mainnet",
  network: "Mainnet",
  website: "https://merlinprotocol.org",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc.merlinchain.io",
  blockExplorerUrl: "https://scan.merlinchain.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var IoTeX = {
  id: 4689,
  name: "iotex",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/iotex/native.png",
  nativeIcon: "",
  fullname: "IoTeX Mainnet",
  network: "Mainnet",
  website: "https://iotex.io",
  nativeCurrency: {
    name: "IOTX",
    symbol: "IOTX",
    decimals: 18
  },
  rpcUrl: "https://babel-api.mainnet.iotex.io",
  blockExplorerUrl: "https://iotexscan.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var IoTeXTestnet = {
  id: 4690,
  name: "iotex",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/iotex/native.png",
  nativeIcon: "",
  fullname: "IoTeX Testnet",
  network: "Testnet",
  website: "https://iotex.io",
  nativeCurrency: {
    name: "IOTX",
    symbol: "IOTX",
    decimals: 18
  },
  rpcUrl: "https://babel-api.testnet.iotex.io",
  blockExplorerUrl: "https://testnet.iotexscan.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Mantle = {
  id: 5e3,
  name: "Mantle",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/mantle/native.png",
  nativeIcon: "",
  fullname: "Mantle Mainnet",
  network: "Mainnet",
  website: "https://mantle.xyz",
  nativeCurrency: {
    name: "MNT",
    symbol: "MNT",
    decimals: 18
  },
  rpcUrl: "https://rpc.mantle.xyz",
  blockExplorerUrl: "https://explorer.mantle.xyz",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var MantleSepoliaTestnet = {
  id: 5003,
  name: "Mantle",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/mantle/native.png",
  nativeIcon: "",
  fullname: "Mantle Sepolia Testnet",
  network: "Testnet",
  website: "https://mantle.xyz",
  nativeCurrency: {
    name: "MNT",
    symbol: "MNT",
    decimals: 18
  },
  rpcUrl: "https://rpc.sepolia.mantle.xyz",
  faucetUrl: "https://faucet.sepolia.mantle.xyz",
  blockExplorerUrl: "https://explorer.sepolia.mantle.xyz",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Duckchain = {
  id: 5545,
  name: "Duckchain",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/duckchain/native.png",
  nativeIcon: "https://static.particle.network/token-list/duckchain/ton.png",
  fullname: "Duckchain Mainnet",
  network: "Mainnet",
  website: "https://duckchain.io",
  nativeCurrency: {
    name: "TON",
    symbol: "TON",
    decimals: 18
  },
  rpcUrl: "https://rpc.duckchain.io",
  blockExplorerUrl: "https://scan.duckchain.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var opBNBTestnet = {
  id: 5611,
  name: "opBNB",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/opbnb/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "opBNB Testnet",
  network: "Testnet",
  website: "https://opbnb.bnbchain.org",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://opbnb-testnet-rpc.bnbchain.org",
  blockExplorerUrl: "https://opbnb-testnet.bscscan.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var AuraTestnet = {
  id: 6321,
  name: "aura",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/aura/native.png",
  nativeIcon: "",
  fullname: "Aura Testnet",
  network: "Testnet",
  website: "https://aura.network",
  nativeCurrency: {
    name: "AURA",
    symbol: "AURA",
    decimals: 18
  },
  rpcUrl: "https://jsonrpc.euphoria.aura.network",
  blockExplorerUrl: "https://euphoria.aurascan.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Aura = {
  id: 6322,
  name: "aura",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/aura/native.png",
  nativeIcon: "",
  fullname: "Aura Mainnet",
  network: "Mainnet",
  website: "https://aura.network",
  nativeCurrency: {
    name: "AURA",
    symbol: "AURA",
    decimals: 18
  },
  rpcUrl: "https://jsonrpc.aura.network",
  blockExplorerUrl: "https://aurascan.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var ZetaChain = {
  id: 7e3,
  name: "ZetaChain",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zetachain/native.png",
  nativeIcon: "",
  fullname: "ZetaChain Mainnet",
  network: "Mainnet",
  website: "https://zetachain.com",
  nativeCurrency: {
    name: "ZETA",
    symbol: "ZETA",
    decimals: 18
  },
  rpcUrl: "https://zetachain-evm.blockpi.network/v1/rpc/public",
  blockExplorerUrl: "https://zetachain.blockscout.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var ZetaChainTestnet = {
  id: 7001,
  name: "ZetaChain",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zetachain/native.png",
  nativeIcon: "",
  fullname: "ZetaChain Testnet",
  network: "Testnet",
  website: "https://zetachain.com",
  nativeCurrency: {
    name: "ZETA",
    symbol: "ZETA",
    decimals: 18
  },
  rpcUrl: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
  faucetUrl: "https://labs.zetachain.com/get-zeta",
  blockExplorerUrl: "https://zetachain-athens-3.blockscout.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Cyber = {
  id: 7560,
  name: "Cyber",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/cyber/native.png",
  nativeIcon: "",
  fullname: "Cyber Mainnet",
  network: "Mainnet",
  website: "https://cyber-explorer.alt.technology",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://cyber.alt.technology",
  blockExplorerUrl: "https://cyberscan.co",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Klaytn = {
  id: 8217,
  name: "Klaytn",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/klaytn/native.png",
  nativeIcon: "",
  fullname: "Klaytn Mainnet",
  network: "Mainnet",
  website: "https://www.klaytn.com",
  nativeCurrency: {
    name: "Klaytn",
    symbol: "KLAY",
    decimals: 18
  },
  rpcUrl: "https://cypress.fandom.finance/archive",
  blockExplorerUrl: "https://scope.klaytn.com",
  features: [
    {
      name: "SWAP"
    }
  ]
};
var Lorenzo = {
  id: 8329,
  name: "lorenzo",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/lorenzo/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "Lorenzo Mainnet",
  network: "Mainnet",
  website: "https://lorenzo-protocol.xyz",
  nativeCurrency: {
    name: "stBTC",
    symbol: "stBTC",
    decimals: 18
  },
  rpcUrl: "https://rpc.lorenzo-protocol.xyz",
  blockExplorerUrl: "https://scan.lorenzo-protocol.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Base = {
  id: 8453,
  name: "Base",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/base/native.png",
  nativeIcon: "",
  fullname: "Base Mainnet",
  network: "Mainnet",
  website: "https://base.org",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://developer-access-mainnet.base.org",
  blockExplorerUrl: "https://basescan.org",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "LIGHT",
          version: "1.0.2"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var Combo = {
  id: 9980,
  name: "Combo",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/combo/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "Combo Mainnet",
  network: "Mainnet",
  website: "https://docs.combonetwork.io",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://rpc.combonetwork.io",
  blockExplorerUrl: "https://combotrace.nodereal.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var PeaqAgungTestnet = {
  id: 9990,
  name: "peaq",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/peaq/native.png",
  nativeIcon: "",
  fullname: "Peaq Agung Testnet",
  network: "Testnet",
  website: "https://www.peaq.network",
  nativeCurrency: {
    name: "AGUNG",
    symbol: "AGUNG",
    decimals: 18
  },
  rpcUrl: "https://rpcpc1-qa.agung.peaq.network",
  blockExplorerUrl: "https://agung-testnet.subscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var GnosisTestnet = {
  id: 10200,
  name: "Gnosis",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/gnosis/native.png",
  nativeIcon: "",
  fullname: "Gnosis Testnet",
  network: "Testnet",
  website: "https://docs.gnosischain.com",
  nativeCurrency: {
    name: "Gnosis",
    symbol: "XDAI",
    decimals: 18
  },
  rpcUrl: "https://optimism.gnosischain.com",
  faucetUrl: "https://gnosisfaucet.com",
  blockExplorerUrl: "https://blockscout.com/gnosis/chiado",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BEVM = {
  id: 11501,
  name: "BEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bevm/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "BEVM Mainnet",
  network: "Mainnet",
  website: "https://www.bevm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc-mainnet-1.bevm.io",
  blockExplorerUrl: "https://scan-mainnet.bevm.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BEVMTestnet = {
  id: 11503,
  name: "BEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bevm/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "BEVM Testnet",
  network: "Testnet",
  website: "https://www.bevm.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://testnet.bevm.io",
  blockExplorerUrl: "https://scan-testnet.bevm.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var ReadONTestnet = {
  id: 12015,
  name: "ReadON",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/readon/native.png",
  nativeIcon: "",
  fullname: "ReadON Testnet",
  network: "Testnet",
  website: "https://opside.network",
  nativeCurrency: {
    name: "READ",
    symbol: "READ",
    decimals: 18
  },
  rpcUrl: "https://pre-alpha-zkrollup-rpc.opside.network/readon-content-test-chain",
  blockExplorerUrl: "https://readon-content-test-chain.zkevm.opside.info",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var ImmutablezkEVMTestnet = {
  id: 13473,
  name: "Immutable",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/immutable/native.png",
  nativeIcon: "",
  fullname: "Immutable zkEVM Testnet",
  network: "Testnet",
  website: "https://www.immutable.com",
  nativeCurrency: {
    name: "IMX",
    symbol: "IMX",
    decimals: 18
  },
  rpcUrl: "https://rpc.testnet.immutable.com",
  blockExplorerUrl: "https://explorer.testnet.immutable.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var GravityTestnet = {
  id: 13505,
  name: "Gravity",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/gravity/native.png",
  nativeIcon: "",
  fullname: "Gravity Testnet",
  network: "Testnet",
  website: "https://gravity.xyz",
  nativeCurrency: {
    name: "G",
    symbol: "G",
    decimals: 18
  },
  rpcUrl: "https://rpc-sepolia.gravity.xyz",
  blockExplorerUrl: " https://explorer-sepolia.gravity.xyz",
  features: [
    {
      name: "EIP1559"
    }
  ]
};
var EOSEVMTestnet = {
  id: 15557,
  name: "Eosevm",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/eosevm/native.png",
  nativeIcon: "",
  fullname: "EOS EVM Testnet",
  network: "Testnet",
  website: "https://eosnetwork.com",
  nativeCurrency: {
    name: "EOS",
    symbol: "EOS",
    decimals: 18
  },
  rpcUrl: "https://api.testnet.evm.eosnetwork.com",
  faucetUrl: "https://bridge.testnet.evm.eosnetwork.com",
  blockExplorerUrl: "https://explorer.testnet.evm.eosnetwork.com"
};
var EthereumHolesky = {
  id: 17e3,
  name: "Ethereum",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/ethereum/native.png",
  nativeIcon: "",
  fullname: "Ethereum Holesky",
  network: "Holesky",
  website: "https://holesky.ethpandaops.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://ethereum-holesky.blockpi.network/v1/rpc/public",
  faucetUrl: "https://faucet.quicknode.com/drip",
  blockExplorerUrl: "https://holesky.etherscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var EOSEVM = {
  id: 17777,
  name: "Eosevm",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/eosevm/native.png",
  nativeIcon: "",
  fullname: "EOS EVM",
  network: "Mainnet",
  website: "https://eosnetwork.com",
  nativeCurrency: {
    name: "EOS",
    symbol: "EOS",
    decimals: 18
  },
  rpcUrl: "https://api.evm.eosnetwork.com",
  blockExplorerUrl: "https://explorer.evm.eosnetwork.com"
};
var MAPProtocol = {
  id: 22776,
  name: "MAPProtocol",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/mapprotocol/native.png",
  nativeIcon: "",
  fullname: "MAP Protocol",
  network: "Mainnet",
  website: "https://maplabs.io",
  nativeCurrency: {
    name: "MAPO",
    symbol: "MAPO",
    decimals: 18
  },
  rpcUrl: "https://rpc.maplabs.io",
  blockExplorerUrl: "https://mapscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Zeroone = {
  id: 27827,
  name: "Zeroone",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zeroone/native.png",
  nativeIcon: "",
  fullname: "Zeroone Mainnet",
  network: "Mainnet",
  website: "https://zeroone.art",
  nativeCurrency: {
    name: "ZERO",
    symbol: "ZERO",
    decimals: 18
  },
  rpcUrl: "https://subnets.avax.network/zeroonemai/mainnet/rpc",
  blockExplorerUrl: "https://subnets.avax.network/zeroonemai",
  features: [
    {
      name: "EIP1559"
    }
  ]
};
var MovementDevnet = {
  id: 30732,
  name: "Movement",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/movement/native.png",
  nativeIcon: "",
  fullname: "Movement Devnet",
  network: "Devnet",
  website: "https://movementlabs.xyz",
  nativeCurrency: {
    name: "MOVE",
    symbol: "MOVE",
    decimals: 18
  },
  rpcUrl: "https://mevm.devnet.imola.movementnetwork.xyz",
  blockExplorerUrl: "https://explorer.devnet.imola.movementnetwork.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Mode = {
  id: 34443,
  name: "Mode",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/mode/native.png",
  nativeIcon: "",
  fullname: "Mode Mainnet",
  network: "Mainnet",
  website: "https://www.mode.network",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://mainnet.mode.network",
  blockExplorerUrl: "https://explorer.mode.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var ArbitrumOne = {
  id: 42161,
  name: "Arbitrum",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/arbitrum/native.png",
  nativeIcon: "",
  fullname: "Arbitrum One",
  network: "Mainnet",
  website: "https://arbitrum.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  blockExplorerUrl: "https://arbiscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "LIGHT",
          version: "1.0.2"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var ArbitrumNova = {
  id: 42170,
  name: "Arbitrum",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/arbitrum/native.png",
  nativeIcon: "",
  fullname: "Arbitrum Nova",
  network: "Mainnet",
  website: "https://arbitrum.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://nova.arbitrum.io/rpc",
  blockExplorerUrl: "https://nova.arbiscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Celo = {
  id: 42220,
  name: "Celo",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/celo/native.png",
  nativeIcon: "",
  fullname: "Celo Mainnet",
  network: "Mainnet",
  website: "https://docs.celo.org",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18
  },
  rpcUrl: "https://rpc.ankr.com/celo",
  blockExplorerUrl: "https://explorer.celo.org/mainnet",
  features: [
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var OasisEmeraldTestnet = {
  id: 42261,
  name: "OasisEmerald",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/oasisemerald/native.png",
  nativeIcon: "",
  fullname: "OasisEmerald Testnet",
  network: "Testnet",
  website: "https://docs.oasis.io/dapp/emerald",
  nativeCurrency: {
    name: "OasisEmerald",
    symbol: "ROSE",
    decimals: 18
  },
  rpcUrl: "https://testnet.emerald.oasis.dev",
  faucetUrl: "https://faucet.testnet.oasis.dev",
  blockExplorerUrl: "https://testnet.explorer.emerald.oasis.dev"
};
var OasisEmerald = {
  id: 42262,
  name: "OasisEmerald",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/oasisemerald/native.png",
  nativeIcon: "",
  fullname: "OasisEmerald Mainnet",
  network: "Mainnet",
  website: "https://docs.oasis.io/dapp/emerald",
  nativeCurrency: {
    name: "OasisEmerald",
    symbol: "ROSE",
    decimals: 18
  },
  rpcUrl: "https://emerald.oasis.dev",
  blockExplorerUrl: "https://explorer.emerald.oasis.dev"
};
var ZKFair = {
  id: 42766,
  name: "ZKFair",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zkfair/native.png",
  nativeIcon: "https://static.particle.network/token-list/zkfair/usdc.png",
  fullname: "ZKFair Mainnet",
  network: "Mainnet",
  website: "https://zkfair.io",
  nativeCurrency: {
    name: "ZKF",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrl: "https://rpc.zkfair.io",
  blockExplorerUrl: "https://scan.zkfair.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var AvalancheTestnet = {
  id: 43113,
  name: "Avalanche",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/avalanche/native.png",
  nativeIcon: "",
  fullname: "Avalanche Testnet",
  network: "Testnet",
  website: "https://cchain.explorer.avax-test.network",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18
  },
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  faucetUrl: "https://faucet.avax.network",
  blockExplorerUrl: "https://testnet.snowtrace.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Avalanche = {
  id: 43114,
  name: "Avalanche",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/avalanche/native.png",
  nativeIcon: "",
  fullname: "Avalanche Mainnet",
  network: "Mainnet",
  website: "https://www.avax.network",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18
  },
  rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  blockExplorerUrl: "https://snowtrace.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "1.0.0"
        },
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var ZKFairTestnet = {
  id: 43851,
  name: "ZKFair",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zkfair/native.png",
  nativeIcon: "https://static.particle.network/token-list/zkfair/usdc.png",
  fullname: "ZKFair Testnet",
  network: "Testnet",
  website: "https://zkfair.io",
  nativeCurrency: {
    name: "ZKF",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.zkfair.io",
  blockExplorerUrl: "https://testnet-scan.zkfair.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var CeloTestnet = {
  id: 44787,
  name: "Celo",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/celo/native.png",
  nativeIcon: "",
  fullname: "Celo Testnet",
  network: "Testnet",
  website: "https://docs.celo.org",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18
  },
  rpcUrl: "https://alfajores-forno.celo-testnet.org",
  faucetUrl: "https://celo.org/developers/faucet",
  blockExplorerUrl: "https://explorer.celo.org/alfajores"
};
var GOATTestnet3 = {
  id: 48816,
  name: "Goat",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/goat/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "GOAT Testnet3",
  network: "Testnet",
  website: "https://www.goat.network",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc.testnet3.goat.network",
  blockExplorerUrl: "https://explorer.testnet3.goat.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var ZircuitTestnet = {
  id: 48899,
  name: "Zircuit",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zircuit/native.png",
  nativeIcon: "",
  fullname: "Zircuit Testnet",
  network: "Testnet",
  website: "https://www.zircuit.com",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://zircuit1.p2pify.com",
  blockExplorerUrl: "https://explorer.testnet.zircuit.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var DODOChainTestnet = {
  id: 53457,
  name: "DODOChain",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/dodochain/native.png",
  nativeIcon: "",
  fullname: "DODOChain Testnet",
  network: "Testnet",
  website: "https://www.dodochain.com",
  nativeCurrency: {
    name: "DODO",
    symbol: "DODO",
    decimals: 18
  },
  rpcUrl: "https://dodochain-testnet.alt.technology",
  blockExplorerUrl: "https://testnet-scan.dodochain.com",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var ZerooneTestnet = {
  id: 56400,
  name: "Zeroone",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zeroone/native.png",
  nativeIcon: "",
  fullname: "Zeroone Testnet",
  network: "Testnet",
  website: "https://zeroone.art",
  nativeCurrency: {
    name: "ZERO",
    symbol: "ZERO",
    decimals: 18
  },
  rpcUrl: "https://subnets.avax.network/testnetzer/testnet/rpc",
  blockExplorerUrl: "https://subnets-test.avax.network/testnetzer",
  features: [
    {
      name: "EIP1559"
    }
  ]
};
var LineaSepolia = {
  id: 59141,
  name: "Linea",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/linea/native.png",
  nativeIcon: "",
  fullname: "Linea Sepolia",
  network: "Sepolia",
  website: "https://linea.build",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.sepolia.linea.build",
  faucetUrl: "https://faucet.goerli.linea.build",
  blockExplorerUrl: "https://sepolia.lineascan.build",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Linea = {
  id: 59144,
  name: "Linea",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/linea/native.png",
  nativeIcon: "",
  fullname: "Linea Mainnet",
  network: "Mainnet",
  website: "https://linea.build",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.linea.build",
  blockExplorerUrl: "https://lineascan.build",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    },
    {
      name: "SWAP"
    },
    {
      name: "ON-RAMP"
    }
  ]
};
var BOB = {
  id: 60808,
  name: "BOB",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bob/native.png",
  nativeIcon: "",
  fullname: "BOB Mainnet",
  network: "Mainnet",
  website: "https://www.gobob.xyz",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.gobob.xyz",
  blockExplorerUrl: "https://explorer.gobob.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var PolygonAmoy = {
  id: 80002,
  name: "Polygon",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/polygon/native.png",
  nativeIcon: "",
  fullname: "Polygon Amoy",
  network: "Amoy",
  website: "https://polygon.technology",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  rpcUrl: "https://rpc-amoy.polygon.technology",
  blockExplorerUrl: "https://www.oklink.com/amoy",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var BerachainbArtio = {
  id: 80084,
  name: "berachain",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/berachain/native.png",
  nativeIcon: "",
  fullname: "Berachain bArtio",
  network: "bArtio",
  website: "https://www.berachain.com",
  nativeCurrency: {
    name: "BERA",
    symbol: "BERA",
    decimals: 18
  },
  rpcUrl: "https://bartio.rpc.berachain.com",
  faucetUrl: "https://bartio.faucet.berachain.com",
  blockExplorerUrl: "https://bartio.beratrail.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Berachain = {
  id: 80094,
  name: "Berachain",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/berachain/native.png",
  nativeIcon: "",
  fullname: "Berachain",
  network: "Mainnet",
  website: "https://www.berachain.com",
  nativeCurrency: {
    name: "BERA",
    symbol: "BERA",
    decimals: 18
  },
  rpcUrl: "https://rpc.berachain.com",
  blockExplorerUrl: "https://beratrail.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    }
  ]
};
var Blast = {
  id: 81457,
  name: "Blast",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/blast/native.png",
  nativeIcon: "",
  fullname: "Blast Mainnet",
  network: "Mainnet",
  website: "https://blastblockchain.com",
  nativeCurrency: {
    name: "Blast Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.blast.io",
  blockExplorerUrl: "https://blastscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var LorenzoTestnet = {
  id: 83291,
  name: "lorenzo",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/lorenzo/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "Lorenzo Testnet",
  network: "Testnet",
  website: "https://lorenzo-protocol.xyz",
  nativeCurrency: {
    name: "stBTC",
    symbol: "stBTC",
    decimals: 18
  },
  rpcUrl: "https://rpc-testnet.lorenzo-protocol.xyz",
  blockExplorerUrl: "https://scan-testnet.lorenzo-protocol.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BaseSepolia = {
  id: 84532,
  name: "Base",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/base/native.png",
  nativeIcon: "",
  fullname: "Base Sepolia",
  network: "Sepolia",
  website: "https://base.org",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia.base.org",
  faucetUrl: "https://bridge.base.org/deposit",
  blockExplorerUrl: "https://sepolia.basescan.org",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    }
  ]
};
var TUNATestnet = {
  id: 89682,
  name: "TUNA",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/tuna/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "TUNA Testnet",
  network: "Testnet",
  website: "https://tunachain.io",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://babytuna.rpc.tunachain.io",
  blockExplorerUrl: "https://babytuna.explorer.tunachain.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var XterioBNB = {
  id: 112358,
  name: "xterio",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/xterio/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "Xterio(BNB) Mainnet",
  network: "Mainnet",
  website: "https://xter.io",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://xterio.alt.technology",
  blockExplorerUrl: "https://xterscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Taiko = {
  id: 167e3,
  name: "Taiko",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/taiko/native.png",
  nativeIcon: "",
  fullname: "Taiko Mainnet",
  network: "Mainnet",
  website: "https://taiko.xyz",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.mainnet.taiko.xyz",
  blockExplorerUrl: "https://taikoscan.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var TaikoHekla = {
  id: 167009,
  name: "Taiko",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/taiko/native.png",
  nativeIcon: "",
  fullname: "Taiko Hekla",
  network: "Hekla",
  website: "https://taiko.xyz",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.hekla.taiko.xyz",
  blockExplorerUrl: "https://explorer.hekla.taiko.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var BitlayerTestnet = {
  id: 200810,
  name: "Bitlayer",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bitlayer/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "Bitlayer Testnet",
  network: "Testnet",
  website: "https://www.bitlayer.org",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.bitlayer.org",
  blockExplorerUrl: "https://testnet-scan.bitlayer.org",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Bitlayer = {
  id: 200901,
  name: "Bitlayer",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/bitlayer/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "Bitlayer Mainnet",
  network: "Mainnet",
  website: "https://www.bitlayer.org",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://rpc.bitlayer.org",
  blockExplorerUrl: "https://www.btrscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var DuckchainTestnet = {
  id: 202105,
  name: "Duckchain",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/duckchain/native.png",
  nativeIcon: "https://static.particle.network/token-list/duckchain/ton.png",
  fullname: "Duckchain Testnet",
  network: "Testnet",
  website: "https://testnet-scan.duckchain.io",
  nativeCurrency: {
    name: "TON",
    symbol: "TON",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.duckchain.io",
  blockExplorerUrl: "https://testnet-scan.duckchain.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var PlatON = {
  id: 210425,
  name: "PlatON",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/platon/native.png",
  nativeIcon: "",
  fullname: "PlatON Mainnet",
  network: "Mainnet",
  website: "https://www.platon.network",
  nativeCurrency: {
    name: "LAT",
    symbol: "LAT",
    decimals: 18
  },
  rpcUrl: "https://openapi2.platon.network/rpc",
  blockExplorerUrl: "https://scan.platon.network"
};
var ArbitrumSepolia = {
  id: 421614,
  name: "Arbitrum",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/arbitrum/native.png",
  nativeIcon: "",
  fullname: "Arbitrum Sepolia",
  network: "Sepolia",
  website: "https://arbitrum.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  blockExplorerUrl: "https://sepolia.arbiscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    }
  ]
};
var ScrollSepolia = {
  id: 534351,
  name: "Scroll",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/scroll/native.png",
  nativeIcon: "",
  fullname: "Scroll Sepolia",
  network: "Sepolia",
  website: "https://scroll.io",
  nativeCurrency: {
    name: "Scroll",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia-rpc.scroll.io",
  blockExplorerUrl: "https://sepolia.scrollscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Scroll = {
  id: 534352,
  name: "Scroll",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/scroll/native.png",
  nativeIcon: "",
  fullname: "Scroll Mainnet",
  network: "Mainnet",
  website: "https://scroll.io",
  nativeCurrency: {
    name: "Scroll",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.scroll.io",
  blockExplorerUrl: "https://scrollscan.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        }
      ]
    },
    {
      name: "SWAP"
    }
  ]
};
var MerlinTestnet = {
  id: 686868,
  name: "Merlin",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/merlin/native.png",
  nativeIcon: "https://static.particle.network/token-list/btc/native.png",
  fullname: "Merlin Testnet",
  network: "Testnet",
  website: "https://merlinprotocol.org",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.merlinchain.io",
  blockExplorerUrl: "https://testnet-scan.merlinchain.io",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var SeiDevnet = {
  id: 713715,
  name: "Sei",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/sei/native.png",
  nativeIcon: "",
  fullname: "Sei Devnet",
  network: "Devnet",
  website: "https://www.sei.io",
  nativeCurrency: {
    name: "SEI",
    symbol: "SEI",
    decimals: 18
  },
  rpcUrl: "https://evm-rpc-arctic-1.sei-apis.com",
  blockExplorerUrl: "https://devnet.seistream.app",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var zkLinkNova = {
  id: 810180,
  name: "zkLink",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zklink/native.png",
  nativeIcon: "",
  fullname: "zkLink Nova Mainnet",
  network: "Mainnet",
  website: "https://zklink.io",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.zklink.io",
  blockExplorerUrl: "https://explorer.zklink.io"
};
var XterioBNBTestnet = {
  id: 1637450,
  name: "xterio",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/xterio/native.png",
  nativeIcon: "https://static.particle.network/token-list/bsc/native.png",
  fullname: "Xterio(BNB) Testnet",
  network: "Testnet",
  website: "https://xter.io",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrl: "https://xterio-testnet.alt.technology",
  blockExplorerUrl: "https://testnet.xterscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var PlatONTestnet = {
  id: 2206132,
  name: "PlatON",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/platon/native.png",
  nativeIcon: "",
  fullname: "PlatON Testnet",
  network: "Testnet",
  website: "https://www.platon.network",
  nativeCurrency: {
    name: "LAT",
    symbol: "LAT",
    decimals: 18
  },
  rpcUrl: "https://devnetopenapi2.platon.network/rpc",
  faucetUrl: "https://devnet2faucet.platon.network/faucet",
  blockExplorerUrl: "https://devnet2scan.platon.network"
};
var XterioETH = {
  id: 2702128,
  name: "xterioeth",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/xterioeth/native.png",
  nativeIcon: "",
  fullname: "Xterio(ETH) Mainnet",
  network: "Mainnet",
  website: "https://xterscan.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://xterio-eth.alt.technology",
  blockExplorerUrl: "https://eth.xterscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "XTERIO",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var MantaSepolia = {
  id: 3441006,
  name: "Manta",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/manta/native.png",
  nativeIcon: "",
  fullname: "Manta Sepolia",
  network: "Sepolia",
  website: "https://manta.network",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://pacific-rpc.sepolia-testnet.manta.network/http",
  faucetUrl: "https://pacific-info.manta.network",
  blockExplorerUrl: "https://pacific-explorer.sepolia-testnet.manta.network",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var AstarzkEVMTestnet = {
  id: 6038361,
  name: "AstarZkEVM",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/astarzkevm/native.png",
  nativeIcon: "",
  fullname: "Astar zkEVM Testnet",
  network: "Testnet",
  website: "https://astar.network",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.startale.com/zkyoto",
  blockExplorerUrl: "https://zkyoto.explorer.startale.com",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Zora = {
  id: 7777777,
  name: "Zora",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/zora/native.png",
  nativeIcon: "",
  fullname: "Zora Mainnet",
  network: "Mainnet",
  website: "https://zora.energy",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.zora.energy",
  blockExplorerUrl: "https://explorer.zora.energy",
  features: [
    {
      name: "EIP1559"
    }
  ]
};
var EthereumSepolia = {
  id: 11155111,
  name: "Ethereum",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/ethereum/native.png",
  nativeIcon: "",
  fullname: "Ethereum Sepolia",
  network: "Sepolia",
  website: "https://sepolia.otterscan.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.sepolia.org",
  faucetUrl: "https://faucet.quicknode.com/drip",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "LIGHT",
          version: "1.0.2"
        },
        {
          name: "XTERIO",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "1.0.0"
        },
        {
          name: "BTC",
          version: "2.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    }
  ]
};
var OptimismSepolia = {
  id: 11155420,
  name: "Optimism",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/optimism/native.png",
  nativeIcon: "",
  fullname: "Optimism Sepolia",
  network: "Sepolia",
  website: "https://optimism.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia.optimism.io",
  blockExplorerUrl: "https://sepolia-optimism.etherscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.2"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.3"
        }
      ]
    }
  ]
};
var Ancient8Testnet = {
  id: 28122024,
  name: "ancient8",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/ancient8/native.png",
  nativeIcon: "",
  fullname: "Ancient8 Testnet",
  network: "Testnet",
  website: "https://ancient8.gg",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpcv2-testnet.ancient8.gg",
  blockExplorerUrl: "https://scanv2-testnet.ancient8.gg",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var CyberTestnet = {
  id: 111557560,
  name: "Cyber",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/cyber/native.png",
  nativeIcon: "",
  fullname: "Cyber Testnet",
  network: "Testnet",
  website: "https://testnet.cyberscan.co",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://cyber-testnet.alt.technology",
  blockExplorerUrl: "https://testnet.cyberscan.co",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var PlumeTestnet = {
  id: 161221135,
  name: "Plume",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/plume/native.png",
  nativeIcon: "",
  fullname: "Plume Testnet",
  network: "Testnet",
  website: "https://testnet-explorer.plumenetwork.xyz",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.plumenetwork.xyz/infra-partner-http",
  blockExplorerUrl: "https://testnet-explorer.plumenetwork.xyz",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var BlastSepolia = {
  id: 168587773,
  name: "Blast",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/blast/native.png",
  nativeIcon: "",
  fullname: "Blast Sepolia",
  network: "Sepolia",
  website: "https://blastblockchain.com",
  nativeCurrency: {
    name: "Blast Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia.blast.io",
  blockExplorerUrl: "https://testnet.blastscan.io",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "BICONOMY",
          version: "2.0.0"
        },
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        },
        {
          name: "CYBERCONNECT",
          version: "1.0.0"
        },
        {
          name: "COINBASE",
          version: "1.0.0"
        },
        {
          name: "UNIVERSAL",
          version: "1.0.0"
        }
      ]
    }
  ]
};
var Tron = {
  id: 728126428,
  name: "Tron",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/tron/native.png",
  nativeIcon: "",
  fullname: "Tron Mainnet",
  network: "Mainnet",
  website: "https://tron.network",
  nativeCurrency: {
    name: "TRX",
    symbol: "TRX",
    decimals: 6
  },
  rpcUrl: "https://api.trongrid.io",
  blockExplorerUrl: "https://tronscan.io",
  features: [
    {
      name: "ON-RAMP"
    }
  ]
};
var Ancient8 = {
  id: 888888888,
  name: "ancient8",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/ancient8/native.png",
  nativeIcon: "",
  fullname: "Ancient8 Mainnet",
  network: "Mainnet",
  website: "https://ancient8.gg",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://rpc.ancient8.gg",
  blockExplorerUrl: "https://scan.ancient8.gg",
  features: [
    {
      name: "EIP1559"
    },
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var Aurora = {
  id: 1313161554,
  name: "Aurora",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/aurora/native.png",
  nativeIcon: "",
  fullname: "Aurora Mainnet",
  network: "Mainnet",
  website: "https://aurora.dev",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://mainnet.aurora.dev",
  blockExplorerUrl: "https://explorer.aurora.dev",
  features: [
    {
      name: "SWAP"
    }
  ]
};
var AuroraTestnet = {
  id: 1313161555,
  name: "Aurora",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/aurora/native.png",
  nativeIcon: "",
  fullname: "Aurora Testnet",
  network: "Testnet",
  website: "https://aurora.dev",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://testnet.aurora.dev",
  faucetUrl: "https://aurora.dev/faucet",
  blockExplorerUrl: "https://explorer.testnet.aurora.dev"
};
var SKALENebula = {
  id: 1482601649,
  name: "Nebula",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/nebula/native.png",
  nativeIcon: "",
  fullname: "SKALE Nebula",
  network: "Mainnet",
  website: "https://mainnet.skalenodes.com",
  nativeCurrency: {
    name: "sFUEL",
    symbol: "sFUEL",
    decimals: 18
  },
  rpcUrl: "https://mainnet.skalenodes.com/v1/green-giddy-denebola",
  blockExplorerUrl: "https://green-giddy-denebola.explorer.mainnet.skalenodes.com"
};
var Harmony = {
  id: 16666e5,
  name: "Harmony",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/harmony/native.png",
  nativeIcon: "",
  fullname: "Harmony Mainnet",
  network: "Mainnet",
  website: "https://www.harmony.one",
  nativeCurrency: {
    name: "ONE",
    symbol: "ONE",
    decimals: 18
  },
  rpcUrl: "https://api.harmony.one",
  blockExplorerUrl: "https://explorer.harmony.one"
};
var HarmonyTestnet = {
  id: 16667e5,
  name: "Harmony",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/harmony/native.png",
  nativeIcon: "",
  fullname: "Harmony Testnet",
  network: "Testnet",
  website: "https://www.harmony.one",
  nativeCurrency: {
    name: "ONE",
    symbol: "ONE",
    decimals: 18
  },
  rpcUrl: "https://api.s0.b.hmny.io",
  faucetUrl: "https://faucet.pops.one",
  blockExplorerUrl: "https://explorer.pops.one"
};
var KakarotSepolia = {
  id: 1802203764,
  name: "Kakarot",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/kakarot/native.png",
  nativeIcon: "",
  fullname: "Kakarot Sepolia",
  network: "Sepolia",
  website: "https://www.kakarot.org",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrl: "https://sepolia-rpc.kakarot.org",
  blockExplorerUrl: "https://sepolia.kakarotscan.org",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var LumiaTestnet = {
  id: 1952959480,
  name: "Lumia",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/lumia/native.png",
  nativeIcon: "",
  fullname: "Lumia Testnet",
  network: "Testnet",
  website: "https://www.lumia.org",
  nativeCurrency: {
    name: "LUMIA",
    symbol: "LUMIA",
    decimals: 18
  },
  rpcUrl: "https://testnet-rpc.lumia.org",
  blockExplorerUrl: "https://testnet-explorer.lumia.org",
  features: [
    {
      name: "ERC4337",
      contracts: [
        {
          name: "SIMPLE",
          version: "1.0.0"
        },
        {
          name: "SIMPLE",
          version: "2.0.0"
        }
      ]
    }
  ]
};
var TronShasta = {
  id: 2494104990,
  name: "Tron",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/tron/native.png",
  nativeIcon: "",
  fullname: "Tron Shasta",
  network: "Shasta",
  website: "https://www.trongrid.io/shasta",
  nativeCurrency: {
    name: "TRX",
    symbol: "TRX",
    decimals: 6
  },
  rpcUrl: "https://api.shasta.trongrid.io",
  blockExplorerUrl: "https://shasta.tronscan.org"
};
var TronNile = {
  id: 3448148188,
  name: "Tron",
  chainType: "evm",
  icon: "https://static.particle.network/token-list/tron/native.png",
  nativeIcon: "",
  fullname: "Tron Nile",
  network: "Nile",
  website: "https://nileex.io",
  nativeCurrency: {
    name: "TRX",
    symbol: "TRX",
    decimals: 6
  },
  rpcUrl: "https://nile.trongrid.io",
  faucetUrl: "https://nileex.io/join/getJoinPage",
  blockExplorerUrl: "https://nile.tronscan.org"
};
var ParticleChains = {
  "ethereum-1": Ethereum,
  "optimism-10": Optimism,
  "thundercore-18": ThunderCoreTestnet,
  "elastos-20": Elastos,
  "cronos-25": Cronos,
  "bsc-56": BNBChain,
  "okc-65": OKTCTestnet,
  "okc-66": OKTC,
  "confluxespace-71": ConfluxeSpaceTestnet,
  "viction-88": Viction,
  "viction-89": VictionTestnet,
  "bsc-97": BNBChainTestnet,
  "gnosis-100": Gnosis,
  "solana-101": Solana,
  "solana-102": SolanaTestnet,
  "solana-103": SolanaDevnet,
  "thundercore-108": ThunderCore,
  "bob-111": BOBTestnet,
  "fuse-122": Fuse,
  "fuse-123": FuseTestnet,
  "hsk-133": HashKeyChainTestnet,
  "polygon-137": Polygon,
  "manta-169": Manta,
  "hsk-177": HashKeyChain,
  "okbc-195": XLayerTestnet,
  "okbc-196": XLayer,
  "opbnb-204": opBNB,
  "mapprotocol-212": MAPProtocolTestnet,
  "bsquared-223": BSquared,
  "fantom-250": Fantom,
  "zksync-300": zkSyncEraSepolia,
  "kcc-321": KCC,
  "kcc-322": KCCTestnet,
  "zksync-324": zkSyncEra,
  "cronos-338": CronosTestnet,
  "mode-919": ModeTestnet,
  "fiveire-995": fiveire,
  "fiveire-997": fiveireTestnet,
  "klaytn-1001": KlaytnTestnet,
  "confluxespace-1030": ConfluxeSpace,
  "metis-1088": Metis,
  "polygonzkevm-1101": PolygonzkEVM,
  "core-1115": CoreTestnet,
  "core-1116": Core,
  "bsquared-1123": BSquaredTestnet,
  "hybrid-1225": HybridTestnet,
  "moonbeam-1284": Moonbeam,
  "moonriver-1285": Moonriver,
  "moonbeam-1287": MoonbeamTestnet,
  "sei-1328": SeiTestnet,
  "sei-1329": Sei,
  "bevm-1501": BEVMCanary,
  "bevm-1502": BEVMCanaryTestnet,
  "storynetwork-1516": StoryTestnet,
  "gravity-1625": Gravity,
  "combo-1715": ComboTestnet,
  "soneium-1946": SoneiumMinatoTestnet,
  "kava-2221": KavaTestnet,
  "kava-2222": Kava,
  "peaq-2241": PeaqKrest,
  "goat-2345": GOATNetwork,
  "polygonzkevm-2442": PolygonzkEVMCardona,
  "ainn-2648": AILayerTestnet,
  "ainn-2649": AILayer,
  "gmnetwork-2777": GMNetwork,
  "satoshivm-3109": SatoshiVMAlpha,
  "satoshivm-3110": SatoshiVMTestnet,
  "peaq-3338": Peaq,
  "botanix-3636": BotanixTestnet,
  "astarzkevm-3776": AstarzkEVMMainet,
  "fantom-4002": FantomTestnet,
  "merlin-4200": Merlin,
  "iotex-4689": IoTeX,
  "iotex-4690": IoTeXTestnet,
  "mantle-5000": Mantle,
  "mantle-5003": MantleSepoliaTestnet,
  "duckchain-5545": Duckchain,
  "opbnb-5611": opBNBTestnet,
  "aura-6321": AuraTestnet,
  "aura-6322": Aura,
  "zetachain-7000": ZetaChain,
  "zetachain-7001": ZetaChainTestnet,
  "cyber-7560": Cyber,
  "klaytn-8217": Klaytn,
  "lorenzo-8329": Lorenzo,
  "base-8453": Base,
  "combo-9980": Combo,
  "peaq-9990": PeaqAgungTestnet,
  "gnosis-10200": GnosisTestnet,
  "bevm-11501": BEVM,
  "bevm-11503": BEVMTestnet,
  "readon-12015": ReadONTestnet,
  "immutable-13473": ImmutablezkEVMTestnet,
  "gravity-13505": GravityTestnet,
  "eosevm-15557": EOSEVMTestnet,
  "ethereum-17000": EthereumHolesky,
  "eosevm-17777": EOSEVM,
  "mapprotocol-22776": MAPProtocol,
  "zeroone-27827": Zeroone,
  "movement-30732": MovementDevnet,
  "mode-34443": Mode,
  "arbitrum-42161": ArbitrumOne,
  "arbitrum-42170": ArbitrumNova,
  "celo-42220": Celo,
  "oasisemerald-42261": OasisEmeraldTestnet,
  "oasisemerald-42262": OasisEmerald,
  "zkfair-42766": ZKFair,
  "avalanche-43113": AvalancheTestnet,
  "avalanche-43114": Avalanche,
  "zkfair-43851": ZKFairTestnet,
  "celo-44787": CeloTestnet,
  "goat-48816": GOATTestnet3,
  "zircuit-48899": ZircuitTestnet,
  "dodochain-53457": DODOChainTestnet,
  "zeroone-56400": ZerooneTestnet,
  "linea-59141": LineaSepolia,
  "linea-59144": Linea,
  "bob-60808": BOB,
  "polygon-80002": PolygonAmoy,
  "berachain-80084": BerachainbArtio,
  "berachain-80094": Berachain,
  "blast-81457": Blast,
  "lorenzo-83291": LorenzoTestnet,
  "base-84532": BaseSepolia,
  "tuna-89682": TUNATestnet,
  "xterio-112358": XterioBNB,
  "taiko-167000": Taiko,
  "taiko-167009": TaikoHekla,
  "bitlayer-200810": BitlayerTestnet,
  "bitlayer-200901": Bitlayer,
  "duckchain-202105": DuckchainTestnet,
  "platon-210425": PlatON,
  "arbitrum-421614": ArbitrumSepolia,
  "scroll-534351": ScrollSepolia,
  "scroll-534352": Scroll,
  "merlin-686868": MerlinTestnet,
  "sei-713715": SeiDevnet,
  "zklink-810180": zkLinkNova,
  "xterio-1637450": XterioBNBTestnet,
  "platon-2206132": PlatONTestnet,
  "xterioeth-2702128": XterioETH,
  "manta-3441006": MantaSepolia,
  "astarzkevm-6038361": AstarzkEVMTestnet,
  "zora-7777777": Zora,
  "ethereum-11155111": EthereumSepolia,
  "optimism-11155420": OptimismSepolia,
  "ancient8-28122024": Ancient8Testnet,
  "cyber-111557560": CyberTestnet,
  "plume-161221135": PlumeTestnet,
  "blast-168587773": BlastSepolia,
  "tron-728126428": Tron,
  "ancient8-888888888": Ancient8,
  "aurora-1313161554": Aurora,
  "aurora-1313161555": AuroraTestnet,
  "nebula-1482601649": SKALENebula,
  "harmony-1666600000": Harmony,
  "harmony-1666700000": HarmonyTestnet,
  "kakarot-1802203764": KakarotSepolia,
  "lumia-1952959480": LumiaTestnet,
  "tron-2494104990": TronShasta,
  "tron-3448148188": TronNile
};

// src/utils.ts
var utils_exports = {};
__export(utils_exports, {
  getAASigners: () => getAASigners,
  getAllChainInfos: () => getAllChainInfos,
  getChainIcon: () => getChainIcon,
  getChainInfo: () => getChainInfo,
  getChainNetwork: () => getChainNetwork,
  getChainSymbol: () => getChainSymbol,
  getChainType: () => getChainType,
  getEVMChainInfoById: () => getEVMChainInfoById,
  getParticleNode: () => getParticleNode,
  getSolanaChainInfoById: () => getSolanaChainInfoById,
  isChainSupportEIP1559: () => isChainSupportEIP1559,
  isChainSupportERC4337: () => isChainSupportERC4337,
  isChainSupportOnRamp: () => isChainSupportOnRamp,
  isChainSupportSwap: () => isChainSupportSwap
});
function getChainInfo(chain) {
  return ParticleChains[`${chain.name.toLowerCase()}-${chain.id}`];
}
function getChainNetwork(chain) {
  const target = getChainInfo(chain);
  return (target == null ? void 0 : target.network) || "UNKNOWN";
}
function getChainSymbol(chain) {
  var _a;
  const target = getChainInfo(chain);
  return ((_a = target == null ? void 0 : target.nativeCurrency) == null ? void 0 : _a.symbol) || "UNKNOWN";
}
function getChainType(chain) {
  const target = getChainInfo(chain);
  return target == null ? void 0 : target.chainType;
}
function isChainSupportEIP1559(chain) {
  var _a, _b;
  const target = getChainInfo(chain);
  return (_b = (_a = target == null ? void 0 : target.features) == null ? void 0 : _a.some((it) => it.name === "EIP1559")) != null ? _b : false;
}
function isChainSupportSwap(chain) {
  var _a, _b;
  const target = getChainInfo(chain);
  return (_b = (_a = target == null ? void 0 : target.features) == null ? void 0 : _a.some((it) => it.name === "SWAP")) != null ? _b : false;
}
function isChainSupportOnRamp(chain) {
  var _a, _b;
  const target = getChainInfo(chain);
  return (_b = (_a = target == null ? void 0 : target.features) == null ? void 0 : _a.some((it) => it.name === "ON-RAMP")) != null ? _b : false;
}
function isChainSupportERC4337(chain, { name, version }) {
  var _a, _b, _c, _d;
  const target = getChainInfo(chain);
  return (_d = (_c = (_b = (_a = target == null ? void 0 : target.features) == null ? void 0 : _a.find((it) => it.name === "ERC4337")) == null ? void 0 : _b.contracts) == null ? void 0 : _c.some((contract) => contract.name === name && contract.version === version)) != null ? _d : false;
}
function getChainIcon(chain) {
  const target = getChainInfo(chain);
  return target == null ? void 0 : target.icon;
}
function getEVMChainInfoById(id) {
  return Object.values(ParticleChains).find((it) => it.chainType === "evm" && it.id === id);
}
function getSolanaChainInfoById(id) {
  return Object.values(ParticleChains).find((it) => it.chainType === "solana" && it.id === id);
}
function getAllChainInfos(compareFn) {
  const chains = Object.values(ParticleChains);
  if (compareFn) {
    return chains.sort(compareFn);
  }
  const sortKeys = [
    "Solana",
    "Ethereum",
    "BSC",
    "opBNB",
    "Polygon",
    "Avalanche",
    "Moonbeam",
    "Moonriver",
    "Heco",
    "Fantom",
    "Arbitrum",
    "Harmony",
    "Aurora",
    "Optimism",
    "KCC",
    "PlatON",
    "Tron"
  ];
  chains.sort((a, b) => {
    if (sortKeys.includes(a.name) && sortKeys.includes(b.name)) {
      if (a.name === b.name) {
        if (a.network === "Mainnet") {
          return -1;
        } else if (b.network === "Mainnet") {
          return 1;
        } else if (a.network === "Testnet") {
          return -1;
        } else if (b.network === "Testnet") {
          return 1;
        }
        return 0;
      } else if (sortKeys.indexOf(a.name) > sortKeys.indexOf(b.name)) {
        return 1;
      }
      return -1;
    } else if (sortKeys.includes(a.name)) {
      return -1;
    } else if (sortKeys.includes(b.name)) {
      return 1;
    } else if (a.name === b.name) {
      if (a.network === "Mainnet") {
        return -1;
      } else if (b.network === "Mainnet") {
        return 1;
      }
      return a.fullname.localeCompare(b.fullname);
    } else {
      return a.name.localeCompare(b.name);
    }
  });
  return chains;
}
function getParticleNode(id, projectId, projectKey) {
  return `https://rpc.particle.network/evm-chain?chainId=${id}&projectUuid=${projectId}&projectKey=${projectKey}`;
}
function getAASigners({ name, version }) {
  const supportedPasskey = ["UNIVERSAL 1.0.0", "BICONOMY 2.0.0", "XTERIO 1.0.0", "COINBASE 1.0.0"];
  const signers = [];
  if (supportedPasskey.includes(`${name} ${version}`)) {
    signers.push("PASSKEY");
    if (`${name} ${version}` === "COINBASE 1.0.0") {
      return signers;
    }
  }
  signers.unshift("EOA");
  return signers;
}
//# sourceMappingURL=index.js.map
