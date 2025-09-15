import { Template } from './types';

// Built-in templates for restaurant use cases
export const STAMP_CARD_TEMPLATE: Template = {
  id: 'stamp_card_v1',
  name: 'Stamp Card',
  style: 'generic',
  images: [
    { role: 'icon', required: true, recommendedSize: { w: 29, h: 29 } },
    { role: 'logo', required: false, recommendedSize: { w: 160, h: 50 } },
    { role: 'strip', required: false, recommendedSize: { w: 320, h: 84 } },
  ],
  fields: [
    {
      slot: 'primary',
      key: 'stamps',
      label: 'Stamps',
      valueExpr: { concat: [{ var: 'stampCount' }, ' of ', { var: 'stampTarget' }] },
    },
    {
      slot: 'secondary',
      key: 'brand',
      label: 'Brand',
      valueExpr: { var: 'brandName' },
    },
    {
      slot: 'auxiliary',
      key: 'reward',
      label: 'Reward',
      valueExpr: { var: 'rewardText' },
    },
  ],
  barcode: {
    format: 'PKBarcodeFormatQR',
    messageExpr: { var: 'barcodeMessage' },
    messageEncoding: 'utf-8',
    altTextExpr: { var: 'barcodeAltText' },
  },
  defaultColors: {
    backgroundColor: 'rgb(60,65,80)',
    foregroundColor: 'rgb(255,255,255)',
    labelColor: 'rgb(255,255,255)',
  },
  variables: {
    brandName: {
      type: 'string',
      description: 'Name of the business or brand',
      required: true,
    },
    stampCount: {
      type: 'number',
      description: 'Current number of stamps earned',
      required: true,
    },
    stampTarget: {
      type: 'number',
      description: 'Total number of stamps needed for reward',
      required: true,
    },
    rewardText: {
      type: 'string',
      description: 'Description of the reward earned',
      required: true,
    },
    barcodeMessage: {
      type: 'string',
      description: 'Message encoded in the barcode',
      required: false,
    },
    barcodeAltText: {
      type: 'string',
      description: 'Alternative text for the barcode',
      required: false,
    },
  },
};

export const COUPON_TEMPLATE: Template = {
  id: 'coupon_v1',
  name: 'Coupon',
  style: 'generic',
  images: [
    { role: 'icon', required: true, recommendedSize: { w: 29, h: 29 } },
    { role: 'logo', required: true, recommendedSize: { w: 160, h: 50 } },
    { role: 'strip', required: false, recommendedSize: { w: 320, h: 84 } },
  ],
  fields: [
    {
      slot: 'primary',
      key: 'offer',
      label: 'Offer',
      valueExpr: { var: 'offerText' },
    },
    {
      slot: 'secondary',
      key: 'expiry',
      label: 'Expires',
      valueExpr: { format: 'Expires {0}', args: [{ var: 'expiryDate' }] },
    },
    {
      slot: 'auxiliary',
      key: 'code',
      label: 'Code',
      valueExpr: { var: 'couponCode' },
    },
  ],
  barcode: {
    format: 'PKBarcodeFormatQR',
    messageExpr: { var: 'couponCode' },
    messageEncoding: 'utf-8',
    altTextExpr: { var: 'couponCode' },
  },
  defaultColors: {
    backgroundColor: 'rgb(255,255,255)',
    foregroundColor: 'rgb(0,0,0)',
    labelColor: 'rgb(100,100,100)',
  },
  variables: {
    offerText: {
      type: 'string',
      description: 'Description of the coupon offer',
      required: true,
    },
    expiryDate: {
      type: 'date',
      description: 'Expiration date of the coupon',
      required: true,
    },
    couponCode: {
      type: 'string',
      description: 'Coupon code for redemption',
      required: true,
    },
    brandName: {
      type: 'string',
      description: 'Name of the business or brand',
      required: true,
    },
  },
};

export const MEMBERSHIP_TEMPLATE: Template = {
  id: 'membership_v1',
  name: 'Membership Card',
  style: 'generic',
  images: [
    { role: 'icon', required: true, recommendedSize: { w: 29, h: 29 } },
    { role: 'logo', required: true, recommendedSize: { w: 160, h: 50 } },
    { role: 'strip', required: false, recommendedSize: { w: 320, h: 84 } },
  ],
  fields: [
    {
      slot: 'primary',
      key: 'member',
      label: 'Member',
      valueExpr: { var: 'memberName' },
    },
    {
      slot: 'secondary',
      key: 'tier',
      label: 'Tier',
      valueExpr: { var: 'membershipTier' },
    },
    {
      slot: 'auxiliary',
      key: 'expiry',
      label: 'Expires',
      valueExpr: { format: 'Expires {0}', args: [{ var: 'expiryDate' }] },
    },
  ],
  barcode: {
    format: 'PKBarcodeFormatCode128',
    messageExpr: { var: 'memberId' },
    messageEncoding: 'utf-8',
    altTextExpr: { var: 'memberId' },
  },
  defaultColors: {
    backgroundColor: 'rgb(30,30,30)',
    foregroundColor: 'rgb(255,255,255)',
    labelColor: 'rgb(200,200,200)',
  },
  variables: {
    memberName: {
      type: 'string',
      description: 'Name of the member',
      required: true,
    },
    membershipTier: {
      type: 'enum',
      description: 'Membership tier level',
      required: true,
      options: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    },
    memberId: {
      type: 'string',
      description: 'Unique member identification number',
      required: true,
    },
    expiryDate: {
      type: 'date',
      description: 'Membership expiration date',
      required: true,
    },
    brandName: {
      type: 'string',
      description: 'Name of the business or brand',
      required: true,
    },
  },
};

// All available templates
export const TEMPLATES: Template[] = [
  STAMP_CARD_TEMPLATE,
  COUPON_TEMPLATE,
  MEMBERSHIP_TEMPLATE,
];

// Template lookup by ID
export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find(template => template.id === id);
}

// Get all templates
export function getAllTemplates(): Template[] {
  return TEMPLATES;
}
