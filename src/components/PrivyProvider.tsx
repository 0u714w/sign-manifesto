'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { ReactNode } from 'react';

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <Privy
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#000000',
        },
        defaultChain: {
          id: 8453, // Base Mainnet
          name: 'Base',
          rpcUrls: {
            default: { http: ['https://mainnet.base.org'] },
            public: { http: ['https://mainnet.base.org'] },
          },
          blockExplorers: {
            default: { name: 'BaseScan', url: 'https://basescan.org' },
          },
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
        },
        supportedChains: [
          {
            id: 8453, // Base Mainnet
            name: 'Base',
            rpcUrls: {
              default: { http: ['https://mainnet.base.org'] },
              public: { http: ['https://mainnet.base.org'] },
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://basescan.org' },
            },
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
          },
        ],
      }}
    >
      <SmartWalletsProvider
        config={{
          paymasterContext: {
            mode: 'SPONSORED',
            calculateGasLimits: true,
            expiryDuration: 300,
            sponsorshipInfo: {
              webhookData: {},
              smartAccountInfo: {
                name: 'BICONOMY',
                version: '2.0.0'
              }
            }
          }
        }}
      >
        {children}
      </SmartWalletsProvider>
    </Privy>
  );
} 