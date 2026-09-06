// Official Contact & Social Media URLs for Pesa Cash Uganda

export const SUPPORT_CONFIG = {
  whatsappDisplayNumber: '0773 319479',
  whatsappIntlNumber: '+256773319479',
  whatsappWaMeNumber: '256773319479',
  whatsappDirectUrl: 'https://wa.me/256773319479',
  whatsappGroupUrl: 'https://chat.whatsapp.com/HNGXwXfln0h9t6NwEDzRSB?s=cl&p=a&mlu=4&ilr=4',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029VazB22oEFeXpRzIEEL1q',
  defaultSupportMessage: (username?: string) =>
    `Hello Pesa Cash Admin, I need assistance with my account${username ? ` (${username})` : ''}.`
};

export const getWhatsAppHelpUrl = (customText?: string) => {
  const text = customText || 'Hello Pesa Cash Support, I need help with my account.';
  return `https://wa.me/${SUPPORT_CONFIG.whatsappWaMeNumber}?text=${encodeURIComponent(text)}`;
};
