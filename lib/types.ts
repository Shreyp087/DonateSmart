export type ItemCondition = "good" | "better" | "best";

export type ItemCategory =
  | "clothing"
  | "shoes"
  | "accessories"
  | "home"
  | "electronics"
  | "books"
  | "toys"
  | "other";

export type ItemStatus =
  | "submitted"
  | "waiting-approval"
  | "received"
  | "approved"
  | "ready-for-floor"
  | "sold";
export type ClothingBulkRange = "0-10" | "10-20" | "20-30" | "30-40" | "40+";

export interface DonorInput {
  name: string;
  email: string;
  phone: string;
}

export interface DonationInput {
  itemName: string;
  category: ItemCategory;
  isBulkClothing?: boolean;
  bulkClothingRange?: ClothingBulkRange | "";
  condition: ItemCondition;
  brand?: string;
  size?: string;
  description?: string;
  imageDataUrl: string;
}

export interface SuggestedRange {
  low: number;
  high: number;
  label: string;
}

export type PricingMethod = "gemini-grounded" | "gemini" | "rules";

export interface AppraisalSource {
  title: string;
  uri: string;
}

export interface ItemAppraisal {
  pricingMethod: PricingMethod;
  pricingModel: string;
  summary: string;
  conditionAssessment: string;
  detectedCategory: string;
  categoryMatch: boolean;
  validationNote: string;
  searchQueries: string[];
  sources: AppraisalSource[];
  analyzedAt: string;
}

export interface DonorProfile extends DonorInput {
  id: string;
  totalLoyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyNeeds {
  categories: string[];
  updatedAt: string;
}

export interface BuyerStoryStep {
  label: string;
  detail: string;
}

export interface BuyerStory {
  title: string;
  preview: string;
  detail: string;
  buyMessage: string;
  pickupMessage: string;
  steps: BuyerStoryStep[];
  generatedAt: string;
  model: string;
}

export interface DonationItem extends DonationInput {
  id: string;
  qrCodeId: string;
  donorId: string | null;
  isAnonymousDonation: boolean;
  status: ItemStatus;
  createdAt: string;
  approvedAt?: string;
  soldAt?: string;
  soldPrice?: number;
  qrCodeDataUrl: string;
  suggestedResaleRange: SuggestedRange;
  loyaltyPointsAwarded: number;
  donorImpactMessage: string;
  appraisal: ItemAppraisal;
  buyerStory?: BuyerStory;
}
