export interface Message {
  id: string;
  sender: string;
  text?: string;
  timestamp: number;
  sealed?: boolean;
  ciphertext?: string;
  iv?: string;
}
export interface SecretData {
  text?: string;
  sealed?: boolean;
  ciphertext?: string;
  salt?: string;
  iv?: string;
  views?: number;
  maxViews?: number;
  createdAt?: number;
}