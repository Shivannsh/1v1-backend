import dotenv from 'dotenv';
import { ethers } from 'ethers';
import schedule from 'node-schedule';
import express from 'express';

// Load environment variables
dotenv.config();
const { 
    PRIVATE_KEY, 
    RPC_URL, 
    CONTRACT_ADDRESS, 
    PORT = 3000 
} = process.env;

// Validate environment variables
if (!PRIVATE_KEY || !RPC_URL || !CONTRACT_ADDRESS) {
    throw new Error('Missing required environment variables');
}

// Contract ABI (updated for ethers v6)
const contractAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "challenger",
				"type": "address"
			}
		],
		"name": "BetChallenged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "targetPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isAbove",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timeframe",
				"type": "uint256"
			}
		],
		"name": "BetOrderCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "winnerPrize",
				"type": "uint256"
			}
		],
		"name": "BetPrizeDistributed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "BetRefunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalPrize",
				"type": "uint256"
			}
		],
		"name": "BetResolved",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "challengeBetOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "targetPrice",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isAbove",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "timeframe",
				"type": "uint256"
			}
		],
		"name": "createBetOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "depositEth",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "depositor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "EthDeposited",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "EthWithdrawn",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "resolveOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "resolveOrders",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalBetsPlaced",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalBetsWon",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalAmountWon",
				"type": "uint256"
			}
		],
		"name": "UserBetStatUpdated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdrawEth",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "betOrders",
		"outputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "targetPrice",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isAbove",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "timeframe",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "startTimestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "challenger",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "resolved",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "won",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractEthBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPendingOrderCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getUserBetHistory",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "creator",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "targetPrice",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isAbove",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "timeframe",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "startTimestamp",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "challenger",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "resolved",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "won",
						"type": "bool"
					}
				],
				"internalType": "struct PvPBettingPlatform.BetOrder[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getUserBetStats",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "totalBetsPlaced",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalBetsWon",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalAmountWon",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalAmountBet",
						"type": "uint256"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "creator",
								"type": "address"
							},
							{
								"internalType": "address",
								"name": "token",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "targetPrice",
								"type": "uint256"
							},
							{
								"internalType": "bool",
								"name": "isAbove",
								"type": "bool"
							},
							{
								"internalType": "uint256",
								"name": "timeframe",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "startTimestamp",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "challenger",
								"type": "address"
							},
							{
								"internalType": "bool",
								"name": "resolved",
								"type": "bool"
							},
							{
								"internalType": "bool",
								"name": "won",
								"type": "bool"
							}
						],
						"internalType": "struct PvPBettingPlatform.BetOrder[]",
						"name": "betHistory",
						"type": "tuple[]"
					}
				],
				"internalType": "struct PvPBettingPlatform.UserBetStats",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "nextOrderId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "orderIndexes",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "pendingOrders",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PLATFORM_FEE_PERCENTAGE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "tokenPriceFeeds",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userBetStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalBetsPlaced",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBetsWon",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalAmountWon",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalAmountBet",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Create provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);

// Function to resolve orders with improved error handling
async function resolvePendingOrders() {
    try {
        // Check pending order count
        const pendingOrderCount = await contract.getPendingOrderCount();
        console.log(`Pending orders: ${pendingOrderCount}`);

        if (pendingOrderCount > 0) {
            // Estimate gas for the transaction
            const gasEstimate = await contract.resolveOrders.estimateGas();
            console.log(`Estimated gas: ${gasEstimate}`);

            // Send transaction with recommended gas settings
            const tx = await contract.resolveOrders({
                gasLimit: gasEstimate * 2n, // Add some buffer
                maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
                maxFeePerGas: ethers.parseUnits('100', 'gwei')
            });

            console.log("Resolving orders:", tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            console.log("Orders resolved:", receipt.status === 1 ? "Success" : "Failure");
            
            return receipt.status === 1;
        } else {
            console.log("No pending orders to resolve");
            return false;
        }
    } catch (error) {
        console.error("Error resolving orders:", error);
        
        // Improved error handling
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.error("Insufficient funds to pay for gas");
        } else if (error.code === 'NETWORK_ERROR') {
            console.error("Network connection issue");
        }
        
        throw error;
    }
}

// Set up Express server
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Manual resolution endpoint
app.post("/resolve", async (req, res) => {
    try {
        const result = await resolvePendingOrders();
        res.status(200).json({
            message: "Pending orders resolution attempted",
            resolved: result
        });
    } catch (err) {
        console.error("Endpoint error:", err);
        res.status(500).json({
            message: "Error resolving orders",
            error: err.message
        });
    }
});

// Schedule the task to run periodically (every 5 minutes)
schedule.scheduleJob("*/1 * * * *", async () => {
    try {
        await resolvePendingOrders();
    } catch (error) {
        console.error("Scheduled job error:", error);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully');
    schedule.cancelJob(); // Cancel scheduled jobs
    process.exit(0);
});