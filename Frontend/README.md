# Will Transfer DAO - Frontend

Welcome to the frontend application for the Will Transfer DAO, a decentralized application (dApp) built to manage digital wills on the blockchain. This project provides a user-friendly interface for interacting with the `WillTransfer` smart contract deployed on the tCORE Testnet.

This frontend was bootstrapped using Next.js and incorporates modern web development practices and UI components, likely inspired by or built with tools like Shadcn/UI, Radix UI, and Tailwind CSS.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Smart Contract Details](#smart-contract-details)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Set Up Environment Variables](#3-set-up-environment-variables)
  - [4. Run the Development Server](#4-run-the-development-server)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Learn More (Next.js)](#learn-more-nextjs)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Will Transfer DAO frontend enables users to seamlessly create, manage, and execute digital wills. It interacts directly with a smart contract on the tCORE Testnet, ensuring transparency, security, and immutability for will management.

Key functionalities include connecting a Web3 wallet (like MetaMask), creating wills with multiple beneficiaries and specific share allocations, depositing funds, managing executor roles, and processing will execution according to predefined conditions.

## Core Features

- **Wallet Integration:** Connect and disconnect Web3 wallets (e.g., MetaMask).
- **Network Management:** Automatic detection of the tCORE Testnet and prompts for switching if on an incorrect network.
- **Account Information:** Display connected account address and tCORE balance.
- **Will Creation:** Intuitive form to create new wills, specifying description, executor, beneficiaries, and their respective shares. Pays the required creation fee to the smart contract.
- **Will Management (Testator):**
    - View wills created by the user.
    - Deposit additional funds into owned wills.
    - Withdraw funds from owned wills (if applicable).
    - Change the executor for an owned will.
    - Deactivate an owned will.
- **Executor Duties:**
    - View wills where the user is the designated executor.
    - Confirm execution conditions for a will.
    - Execute a confirmed will, distributing assets to beneficiaries.
- **Detailed Will View:** Access comprehensive details for any will.
- **Real-time Notifications:** User feedback for transactions and important events using toast notifications.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (v15+ with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Blockchain Interaction:** [ethers.js](https://ethers.org/) (v6+)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** Likely built with [Shadcn/UI](https://ui.shadcn.com/) or a similar approach using Radix UI primitives and custom styling.
- **State Management:** React Context API (as seen in `Web3Context.tsx`), potentially combined with React's built-in state management.
- **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/)
- **Package Manager:** [pnpm](https://pnpm.io/)

## Smart Contract Details

- **Contract Name:** `WillTransfer`
- **Network:** tCORE Testnet
- **Contract Address:** `0xDC42B46C06bBE6FcAD2678cAEe7B8fF97e649d2A`
- **Chain ID:** `1114` (decimal) / `0x45a` (hexadecimal)
- **RPC URL:** `https://rpc.test2.btcs.network`
- **Block Explorer:** `https://scan.test2.btcs.network`
- **ABI Location:** The contract ABI is located at `new_frontend/abi/WillTransfer.json`.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [pnpm](https://pnpm.io/installation)
- A Web3 wallet browser extension, such as [MetaMask](https://metamask.io/), configured for the tCORE Testnet.
- Test tCORE tokens (can be obtained from the [tCORE Testnet Faucet](https://scan.test2.btcs.network/faucet)).

## Getting Started

Follow these steps to set up and run the project locally:

### 1. Clone the Repository

```bash
git clone https://github.com/Ayusman-Singhal/InheritX.git
cd InheritX
```

### 2. Install Dependencies

Install project dependencies using `pnpm`:

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of the `InheritX` directory. This file is used for environment-specific configurations and is not committed to Git.

Copy the contents of `.env.example` (if it exists) or create a new `.env.local` file with the following content:

```env
# Next.js public environment variables need to be prefixed with NEXT_PUBLIC_
NEXT_PUBLIC_WILL_TRANSFER_CONTRACT_ADDRESS=0xDC42B46C06bBE6FcAD2678cAEe7B8fF97e649d2A

# You can add other environment variables here if needed
# NEXT_PUBLIC_TCORE_CHAIN_ID=1114
# NEXT_PUBLIC_TCORE_RPC_URL=https://rpc.test2.btcs.network
```

**Note:** The application currently has the contract address hardcoded in `components/Web3Context.tsx`. For best practice and flexibility, modify `Web3Context.tsx` to read `NEXT_PUBLIC_WILL_TRANSFER_CONTRACT_ADDRESS` from `process.env`.

### 4. Run the Development Server

Start the Next.js development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) in your browser to view the application.

## Available Scripts

In the project directory, you can run the following scripts:

- `pnpm run dev`: Runs the app in development mode.
- `pnpm run build`: Builds the app for production.
- `pnpm run start`: Starts the production server (after building).
- `pnpm run lint`: Lints the project files using Next.js's built-in ESLint configuration.

## Project Structure

A brief overview of the key directories:

```
new_frontend/
├── app/                  # Next.js App Router: layouts, pages, components
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page component
│   └── providers.tsx     # Client-side providers (e.g., ThemeProvider)
├── abi/                  # Smart contract ABIs
│   └── WillTransfer.json
├── components/           # Reusable UI components & Web3Context
│   ├── Web3Context.tsx   # Core Web3 logic and state management
│   └── ui/               # (Likely) Shadcn/UI generated components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions (e.g., Shadcn's utils.ts)
├── public/               # Static assets
├── styles/               # Global styles (if any beyond globals.css)
├── next.config.mjs       # Next.js configuration
├── package.json          # Project metadata and dependencies
├── pnpm-lock.yaml        # pnpm lockfile
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```
```
CONTRACT_ADDRESS=0xDC42B46C06bBE6FcAD2678cAEe7B8fF97e649d2A
```