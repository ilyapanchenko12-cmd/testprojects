export enum UserRole {
  MEDIA_BUYER = 'MEDIA_BUYER',
  TEAM_LEAD = 'TEAM_LEAD',
  OWNER = 'OWNER'
}

export enum Direction {
  FB_PURCHASE = 'FB_PURCHASE',
  TG_PURCHASE = 'TG_PURCHASE',
  UBT = 'UBT',
  INFLUENCE = 'INFLUENCE',
  MOTIVE = 'MOTIVE',
  ADVERTISING = 'ADVERTISING'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  members: string[];
  createdAt: Date;
}

export interface TelegramChannel {
  id: string;
  name: string;
  username: string;
  subscribers: number;
  addedAt: Date;
}

export interface Statistics {
  id: string;
  channelId?: string;
  buyerId?: string;
  teamId?: string;
  direction: Direction;
  leadsCount: number;
  unsubscribes: number;
  subscribers: number;
  spend: number;
  revenue?: number;
  soldAds?: number;
  adSlots?: AdSlot[];
  date: Date;
}

export interface AdSlot {
  id: string;
  channelId: string;
  time: string;
  cost: number;
  soldAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface Pixel {
  id: string;
  name: string;
  pixelId: string;
  token: string;
  buyerId: string;
  createdAt: Date;
}

export interface TelegramBot {
  id: string;
  name: string;
  botToken: string;
  username: string;
  buyerId: string;
  createdAt: Date;
}

export enum LinkType {
  AD_LINK = 'AD_LINK',
  CHANNEL_LINK = 'CHANNEL_LINK'
}

export interface AdLink {
  id: string;
  name: string;
  type: LinkType;
  pixelId: string;
  botId: string;
  channelId?: string;
  buyerId: string;
  url: string;
  leadsCount: number;
  unsubscribes: number;
  createdAt: Date;
  updatedAt: Date;
}


