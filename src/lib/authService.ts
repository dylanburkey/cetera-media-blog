/**
 * Secure Authentication Service
 * Handles server-side wallet authentication, signature verification, and token balance checks
 */

import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

// Configuration
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET || 'change-this-in-production';
const JWT_EXPIRY = '24h';
const NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MIN_ATHENA_BALANCE = ethers.utils.parseEther(import.meta.env.PUBLIC_ATHENA_TO_HOLD || process.env.PUBLIC_ATHENA_TO_HOLD || '2000');

// Token contract configuration - use environment variable
const ATHENA_CONTRACT_ADDRESS = import.meta.env.PUBLIC_ATHENA_TOKEN_ADDRESS || 
                                process.env.PUBLIC_ATHENA_TOKEN_ADDRESS || 
                                '0x1a43287cbfcc5f35082e6e2aa98e5b474fe7bd4e'; // Base mainnet ATHENA contract
const ATHENA_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// In-memory nonce storage (use Redis or database in production)
const nonceStore = new Map<string, { nonce: string; expiry: number }>();

/**
 * Generate a unique nonce for authentication
 */
export function generateNonce(address: string): string {
  // Generate random nonce using Math.random for browser compatibility
  const nonce = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  const expiry = Date.now() + NONCE_EXPIRY;
  
  // Store nonce with expiry
  nonceStore.set(address.toLowerCase(), { nonce, expiry });
  
  return nonce;
}

/**
 * Validate nonce for authentication
 */
export function validateNonce(address: string, nonce: string): boolean {
  const stored = nonceStore.get(address.toLowerCase());
  
  if (!stored) return false;
  if (stored.nonce !== nonce) return false;
  if (Date.now() > stored.expiry) {
    nonceStore.delete(address.toLowerCase());
    return false;
  }
  
  // Remove nonce after use (one-time use)
  nonceStore.delete(address.toLowerCase());
  return true;
}

/**
 * Verify wallet signature
 */
export async function verifySignature(
  address: string,
  signature: string,
  message: string,
  nonce: string
): Promise<boolean> {
  try {
    // Validate nonce first
    if (!validateNonce(address, nonce)) {
      console.error('Invalid or expired nonce');
      return false;
    }
    
    // Verify the message contains the nonce
    if (!message.includes(nonce)) {
      console.error('Message does not contain nonce');
      return false;
    }
    
    // Recover address from signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Verify token balance on-chain
 */
export async function verifyTokenBalance(
  address: string,
  rpcUrl?: string,
  env?: any
): Promise<{ balance: string; hasAccess: boolean }> {
  // List of RPC endpoints to try in order
  const rpcEndpoints = [
    rpcUrl,
    env?.BASE_RPC_URL,
    'https://base-mainnet.g.alchemy.com/v2/demo',
    'https://mainnet.base.org',
    'https://base.publicnode.com',
    'https://1rpc.io/base'
  ].filter(Boolean);
  
  const tokenAddress = env?.PUBLIC_ATHENA_TOKEN_ADDRESS || 
                      import.meta.env.PUBLIC_ATHENA_TOKEN_ADDRESS || 
                      process.env.PUBLIC_ATHENA_TOKEN_ADDRESS || 
                      ATHENA_CONTRACT_ADDRESS;
  
  const minBalance = env?.PUBLIC_ATHENA_TO_HOLD || 
                    import.meta.env.PUBLIC_ATHENA_TO_HOLD || 
                    process.env.PUBLIC_ATHENA_TO_HOLD || 
                    '2000';
  
  // Try each RPC endpoint until one works
  for (const endpoint of rpcEndpoints) {
    try {
      console.log(`Trying RPC endpoint: ${endpoint}`);
      
      // Create provider with custom configuration for Cloudflare Workers
      const provider = new ethers.providers.StaticJsonRpcProvider(
        {
          url: endpoint,
          skipFetchSetup: true // Important for Cloudflare Workers
        },
        {
          chainId: 8453,
          name: 'base'
        }
      );
      
      // Create contract instance
      const contract = new ethers.Contract(
        tokenAddress,
        ATHENA_ABI,
        provider
      );
      
      // Get balance
      const balance = await contract.balanceOf(address);
      const minBalanceWei = ethers.utils.parseEther(minBalance);
      const hasAccess = balance.gte(minBalanceWei);
      
      console.log(`Balance check successful for ${address}:`, {
        balance: ethers.utils.formatEther(balance),
        minRequired: minBalance,
        hasAccess,
        tokenAddress,
        rpcUrl: endpoint
      });
      
      return {
        balance: ethers.utils.formatEther(balance),
        hasAccess
      };
    } catch (error) {
      console.error(`RPC endpoint ${endpoint} failed:`, error);
      // Continue to next endpoint
    }
  }
  
  // All endpoints failed
  console.error('All RPC endpoints failed for balance verification');
  return {
    balance: '0',
    hasAccess: false
  };
}

/**
 * Generate JWT session token
 */
export function generateSessionToken(
  address: string,
  hasAccess: boolean,
  balance?: string,
  env?: any
): string {
  const jwtSecret = env?.JWT_SECRET || 
                   import.meta.env.JWT_SECRET || 
                   process.env.JWT_SECRET || 
                   JWT_SECRET;
  
  const payload = {
    address: address.toLowerCase(),
    hasAccess,
    balance,
    iat: Date.now(),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, jwtSecret);
}

/**
 * Verify JWT session token
 */
export function verifySessionToken(
  token: string,
  jwtSecret?: string
): {
  valid: boolean;
  payload?: any;
  error?: string;
} {
  try {
    const secret = jwtSecret || 
                   import.meta.env.JWT_SECRET || 
                   process.env.JWT_SECRET || 
                   JWT_SECRET;
    const payload = jwt.verify(token, secret);
    return { valid: true, payload };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.message || 'Invalid token' 
    };
  }
}

/**
 * Complete authentication flow
 */
export async function authenticateWallet(
  address: string,
  signature: string,
  message: string,
  nonce: string,
  rpcUrl?: string,
  env?: any
): Promise<{
  success: boolean;
  token?: string;
  hasAccess?: boolean;
  balance?: string;
  error?: string;
}> {
  try {
    // Step 1: Verify signature
    const isValidSignature = await verifySignature(address, signature, message, nonce);
    if (!isValidSignature) {
      return { 
        success: false, 
        error: 'Invalid signature' 
      };
    }
    
    // Step 2: Verify token balance
    const { balance, hasAccess } = await verifyTokenBalance(address, rpcUrl, env);
    
    // Step 3: Generate session token
    const token = generateSessionToken(address, hasAccess, balance, env);
    
    return {
      success: true,
      token,
      hasAccess,
      balance
    };
  } catch (error: any) {
    console.error('Authentication failed:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
}

/**
 * Middleware to verify authenticated requests
 */
export function requireAuth(
  request: Request
): { authenticated: boolean; address?: string; hasAccess?: boolean } {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false };
    }
    
    const token = authHeader.substring(7);
    const { valid, payload } = verifySessionToken(token);
    
    if (!valid || !payload) {
      return { authenticated: false };
    }
    
    return {
      authenticated: true,
      address: payload.address,
      hasAccess: payload.hasAccess
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return { authenticated: false };
  }
}

/**
 * Rate limiting for authentication attempts
 */
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();
const MAX_ATTEMPTS = import.meta.env.DEV ? 50 : 5; // More attempts in development
const RATE_LIMIT_WINDOW = import.meta.env.DEV ? 60 * 1000 : 15 * 60 * 1000; // 1 minute in dev, 15 minutes in prod

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (limit.attempts >= MAX_ATTEMPTS) {
    return false;
  }
  
  limit.attempts++;
  return true;
}

/**
 * Clean up expired nonces periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [address, data] of nonceStore.entries()) {
    if (now > data.expiry) {
      nonceStore.delete(address);
    }
  }
}, 60 * 1000); // Run every minute