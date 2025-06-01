# Will Transfer DAO Frontend

A React-based frontend for the Will Transfer DAO smart contract deployed on the tCORE Testnet.

## Overview

This frontend application provides a user interface for interacting with the Will Transfer DAO smart contract. Users can:

- Create new wills with multiple beneficiaries
- Deposit funds to wills
- Withdraw funds from wills (as testator)
- Set and change executors
- Confirm execution conditions (as executor)
- Execute wills and distribute funds (when confirmed)
- Deactivate wills (as testator)

## Technologies Used

- React 18+ with Vite for fast development
- ethers.js 6+ for blockchain interactions
- Tailwind CSS for styling
- react-toastify for notifications
- MetaMask for wallet connection

## Prerequisites

- Node.js and npm installed
- MetaMask browser extension installed
- Access to tCORE Testnet (Chain ID: 1114)

## tCORE Testnet Details

- Network Name: Core Blockchain TestNet
- RPC URL: https://rpc.test2.btcs.network
- Chain ID: 1114 (decimal), 0x45a (hex)
- Currency Symbol: tCORE2
- Block Explorer URL: https://scan.test2.btcs.network
- Faucet URL: https://scan.test2.btcs.network/faucet

## Setup

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example` with your contract address:

```
VITE_WILL_TRANSFER_CONTRACT_ADDRESS=0xDC42B46C06bBE6FcAD2678cAEe7B8fF97e649d2A
```

5. Start the development server:

```bash
npm run dev
```

6. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Build for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

## Contract Address

The Will Transfer DAO smart contract is deployed on the tCORE Testnet at:

```
0xDC42B46C06bBE6FcAD2678cAEe7B8fF97e649d2A
```

## Features

### Wallet Connection
- Connect to MetaMask
- Automatic network detection and switching
- View account balance

### Will Management
- Create new wills with customizable beneficiaries and shares
- View all wills created by the user
- View wills where the user is assigned as executor
- Deposit funds to any active will
- Withdraw funds from owned wills
- Deactivate owned wills

### Executor Functions
- Confirm execution conditions
- Execute wills and distribute funds to beneficiaries

## Project Structure

- `src/components/`: React components
- `src/contexts/`: React contexts for state management
- `src/abi/`: Smart contract ABI
- `src/hooks/`: Custom React hooks (if any)
- `src/main.jsx`: Application entry point
- `src/App.jsx`: Main application component

## License

This project is licensed under the MIT License.
