import { User, Team, TelegramChannel, Statistics, Direction, UserRole, AdSlot, Pixel, TelegramBot, AdLink, LinkType } from '../types';

export const demoUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Админ',
    role: UserRole.OWNER,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    email: 'buyer1@example.com',
    name: 'Алексей Медиабаер',
    role: UserRole.MEDIA_BUYER,
    teamId: 'team1',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '3',
    email: 'lead1@example.com',
    name: 'Мария Тимлид',
    role: UserRole.TEAM_LEAD,
    createdAt: new Date('2024-01-10')
  }
];

export const demoT teams: Team[] = [
  {
    id: 'team1',
    name: 'Команда ФБ закуп',
    leadId: '3',
    members: ['2'],
    createdAt: new Date('2024-01-10')
  }
];

export const demoChannels: TelegramChannel[] = [
  {
    id: 'channel1',
    name: 'Криптовалюты и трейдинг',
    username: '@crypto_trading',
    subscribers: 15420,
    addedAt: new Date('2024-01-01')
  },
  {
    id: 'channel2',
    name: 'Инвестиции и финансы',
    username: '@invest_finance',
    subscribers: 8930,
    addedAt: new Date('2024-01-05')
  },
  {
    id: 'channel3',
    name: 'Бизнес и стартапы',
    username: '@business_startup',
    subscribers: 12350,
    addedAt: new Date('2024-01-10')
  }
];

export const demoAdSlots: AdSlot[] = [
  {
    id: 'slot1',
    channelId: 'channel1',
    time: '18:00',
    cost: 5000,
    soldAt: new Date('2024-01-20')
  },
  {
    id: 'slot2',
    channelId: 'channel1',
    time: '20:00',
    cost: 7500,
    soldAt: new Date('2024-01-21')
  },
  {
    id: 'slot3',
    channelId: 'channel2',
    time: '19:00',
    cost: 3000,
    soldAt: new Date('2024-01-22')
  }
];

export const demoStatistics: Statistics[] = [
  {
    id: 'stat1',
    channelId: 'channel1',
    buyerId: '2',
    teamId: 'team1',
    direction: Direction.FB_PURCHASE,
    leadsCount: 245,
    unsubscribes: 12,
    subscribers: 15420,
    spend: 15000,
    revenue: 35000,
    date: new Date('2024-01-20')
  },
  {
    id: 'stat2',
    channelId: 'channel2',
    buyerId: '2',
    teamId: 'team1',
    direction: Direction.TG_PURCHASE,
    leadsCount: 180,
    unsubscribes: 8,
    subscribers: 8930,
    spend: 12000,
    revenue: 28000,
    date: new Date('2024-01-20')
  },
  {
    id: 'stat3',
    channelId: 'channel3',
    buyerId: '2',
    teamId: 'team1',
    direction: Direction.ADVERTISING,
    leadsCount: 95,
    unsubscribes: 5,
    subscribers: 12350,
    spend: 8000,
    revenue: 22000,
    soldAds: 3,
    adSlots: demoAdSlots,
    date: new Date('2024-01-20')
  },
  {
    id: 'stat4',
    channelId: 'channel1',
    buyerId: '2',
    teamId: 'team1',
    direction: Direction.UBT,
    leadsCount: 320,
    unsubscribes: 15,
    subscribers: 15420,
    spend: 20000,
    revenue: 45000,
    date: new Date('2024-01-21')
  },
  {
    id: 'stat5',
    channelId: 'channel2',
    buyerId: '2',
    teamId: 'team1',
    direction: Direction.INFLUENCE,
    leadsCount: 150,
    unsubscribes: 7,
    subscribers: 8930,
    spend: 10000,
    revenue: 25000,
    date: new Date('2024-01-21')
  },
  {
    id: 'stat6',
    channelId: 'channel3',
    buyerId: '2',
    teamId: 'team1',
    direction: Direction.MOTIVE,
    leadsCount: 200,
    unsubscribes: 10,
    subscribers: 12350,
    spend: 18000,
    revenue: 40000,
    date: new Date('2024-01-21')
  }
];

export const demoPixels: Pixel[] = [
  {
    id: 'pixel1',
    name: 'Facebook Pixel - Крипто',
    pixelId: '123456789012345',
    token: 'EAABwzLixnjYBO...',
    buyerId: '2',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'pixel2',
    name: 'Facebook Pixel - Инвестиции',
    pixelId: '987654321098765',
    token: 'EAABwzLixnjYBO...',
    buyerId: '2',
    createdAt: new Date('2024-01-05')
  },
  {
    id: 'pixel3',
    name: 'TikTok Pixel - Бизнес',
    pixelId: '555666777888999',
    token: 'TikTokToken123...',
    buyerId: '2',
    createdAt: new Date('2024-01-10')
  }
];

export const demoBots: TelegramBot[] = [
  {
    id: 'bot1',
    name: 'Крипто Бот',
    botToken: '1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw',
    username: '@crypto_lead_bot',
    buyerId: '2',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'bot2',
    name: 'Инвестиции Бот',
    botToken: '9876543210:BBHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw',
    username: '@invest_lead_bot',
    buyerId: '2',
    createdAt: new Date('2024-01-05')
  },
  {
    id: 'bot3',
    name: 'Бизнес Бот',
    botToken: '5556667778:CCHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw',
    username: '@business_lead_bot',
    buyerId: '2',
    createdAt: new Date('2024-01-10')
  }
];

export const demoAdLinks: AdLink[] = [
  {
    id: 'link1',
    name: 'Крипто залив - Январь',
    type: LinkType.AD_LINK,
    pixelId: 'pixel1',
    botId: 'bot1',
    channelId: 'channel1',
    buyerId: '2',
    url: 'https://t.me/crypto_lead_bot?start=ad_crypto_jan',
    leadsCount: 245,
    unsubscribes: 12,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'link2',
    name: 'Инвестиции залив - Январь',
    type: LinkType.AD_LINK,
    pixelId: 'pixel2',
    botId: 'bot2',
    channelId: 'channel2',
    buyerId: '2',
    url: 'https://t.me/invest_lead_bot?start=ad_invest_jan',
    leadsCount: 180,
    unsubscribes: 8,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'link3',
    name: 'Бизнес канал - Январь',
    type: LinkType.CHANNEL_LINK,
    pixelId: 'pixel3',
    botId: 'bot3',
    channelId: 'channel3',
    buyerId: '2',
    url: 'https://t.me/business_lead_bot?start=channel_business_jan',
    leadsCount: 95,
    unsubscribes: 5,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'link4',
    name: 'Крипто залив - Февраль',
    type: LinkType.AD_LINK,
    pixelId: 'pixel1',
    botId: 'bot1',
    channelId: 'channel1',
    buyerId: '2',
    url: 'https://t.me/crypto_lead_bot?start=ad_crypto_feb',
    leadsCount: 320,
    unsubscribes: 15,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05')
  },
  {
    id: 'link5',
    name: 'Инвестиции канал - Февраль',
    type: LinkType.CHANNEL_LINK,
    pixelId: 'pixel2',
    botId: 'bot2',
    channelId: 'channel2',
    buyerId: '2',
    url: 'https://t.me/invest_lead_bot?start=channel_invest_feb',
    leadsCount: 150,
    unsubscribes: 7,
    createdAt: new Date('2024-02-02'),
    updatedAt: new Date('2024-02-05')
  }
];


