// src/utils/navConfig.js
export const DEFAULT_NAV = [
  {
    id: 'scanner',
    label: 'Scanner',
    restricted: false,
    children: [
      { id: 'scanner-manual', label: 'Manual' },
      { id: 'scanner-cheatsheet', label: 'Cheat Sheet' },
      { id: 'scanner-general', label: 'General Process' },
      { id: 'scanner-split', label: 'Split Info' },
      { id: 'scanner-email', label: 'Email Template' },
    ],
  },
  {
    id: 'ap',
    label: 'AP',
    restricted: false,
    children: [
      { id: 'ap-manual', label: 'Manual' },
      { id: 'ap-eft', label: 'EFT Payment' },
      { id: 'ap-email', label: 'Email Template' },
    ],
  },
  {
    id: 'seniorap',
    label: 'Senior AP',
    restricted: 'senior',
    children: [
      { id: 'seniorap-post', label: 'Post Payment', restricted: 'postpayment' },
      { id: 'seniorap-recurring', label: 'Recurring Payment' },
      { id: 'seniorap-utilities', label: 'Utilities Tracking Sheet' },
      { id: 'seniorap-bchydro', label: 'BC Hydro EFT' },
      { id: 'seniorap-compliance', label: 'Suppliers Compliance Check' },
      { id: 'seniorap-account', label: 'Account Transfer Tracking' },
    ],
  },
  {
    id: 'apmeeting',
    label: 'AP Meeting',
    restricted: false,
    children: [],
  },
  {
    id: 'discuss',
    label: 'Discuss Board',
    restricted: false,
    children: [],
  },
];
