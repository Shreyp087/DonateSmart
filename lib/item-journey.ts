import { BuyerStory, DonationItem, ItemStatus } from "@/lib/types";
import { formatCurrency, formatDate, toTitleCase } from "@/lib/utils";

type Tone = "amber" | "sky" | "sage" | "slate" | "peach";

export type JourneyStep = {
  label: string;
  detail: string;
  complete: boolean;
  active?: boolean;
};

type StatusMeta = {
  badgeLabel: string;
  tone: Tone;
};

const statusMeta: Record<ItemStatus, StatusMeta> = {
  submitted: {
    badgeLabel: "Submitted",
    tone: "amber"
  },
  "waiting-approval": {
    badgeLabel: "Waiting Approval",
    tone: "amber"
  },
  received: {
    badgeLabel: "Received",
    tone: "sky"
  },
  approved: {
    badgeLabel: "Approved",
    tone: "sky"
  },
  "ready-for-floor": {
    badgeLabel: "On Floor",
    tone: "sage"
  },
  sold: {
    badgeLabel: "Sold",
    tone: "slate"
  }
};

export function getStatusMeta(status: string) {
  return statusMeta[(status as ItemStatus) || "waiting-approval"] ?? statusMeta["waiting-approval"];
}

export function getStatusToneClass(tone: Tone) {
  switch (tone) {
    case "amber":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "sky":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "sage":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "peach":
      return "bg-peach-50 text-peach-600 ring-peach-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export function getDonorLoopSummary(item: DonationItem) {
  switch (item.status) {
    case "submitted":
      return {
        label: "Pending arrival",
        detail: "The QR record is ready. The item still needs to arrive at the store."
      };
    case "waiting-approval":
      return {
        label: "Pending arrival",
        detail: "The item is in the handoff stage and still waiting for staff review."
      };
    case "received":
      return {
        label: "Arrived",
        detail: "Staff has received the item and started the intake review."
      };
    case "approved":
      return {
        label: "Arrived",
        detail: "The item has been accepted and is moving toward the sales floor."
      };
    case "ready-for-floor":
      return {
        label: "On floor",
        detail: "The item is ready for a shopper to discover it."
      };
    case "sold":
      return {
        label: item.soldAt ? `Sold ${formatDate(item.soldAt)}` : "Sold",
        detail: item.soldPrice
          ? `It found a new home for ${formatCurrency(item.soldPrice)}.`
          : "It found a new home."
      };
    default:
      return {
        label: "In progress",
        detail: "This item is still moving through the donation journey."
      };
  }
}

export function getDonorJourneySteps(item: DonationItem): JourneyStep[] {
  const hasArrived = ["received", "approved", "ready-for-floor", "sold"].includes(item.status);
  const isFloorReady = ["ready-for-floor", "sold"].includes(item.status);
  const isSold = item.status === "sold";

  return [
    {
      label: "Submitted",
      detail: item.createdAt ? `Added ${formatDate(item.createdAt)}` : "Donation started",
      complete: true
    },
    {
      label: "Arrived",
      detail: hasArrived ? "Checked in by staff" : "Still on the way",
      complete: hasArrived,
      active: !hasArrived
    },
    {
      label: "On floor",
      detail: isFloorReady ? "Ready for a new home" : "Not on the floor yet",
      complete: isFloorReady,
      active: hasArrived && !isFloorReady
    },
    {
      label: "Loved again",
      detail: isSold ? (item.soldAt ? `Sold ${formatDate(item.soldAt)}` : "Found a new home") : "Waiting for its next owner",
      complete: isSold,
      active: isFloorReady && !isSold
    }
  ];
}

export function getShopAvailabilityLabel(item: DonationItem) {
  if (item.status === "sold") {
    return "Already loved";
  }

  if (["approved", "ready-for-floor"].includes(item.status)) {
    return "Available now";
  }

  return "Coming soon";
}

export function getShopAvailabilityTone(item: DonationItem): Tone {
  if (item.status === "sold") {
    return "slate";
  }

  if (["approved", "ready-for-floor"].includes(item.status)) {
    return "sage";
  }

  return "peach";
}

export function buildFallbackBuyerStory(item: DonationItem): BuyerStory {
  const itemLabel = item.brand ? `${item.brand} ${item.itemName}` : item.itemName;
  const rangeLabel = `${formatCurrency(item.suggestedResaleRange.low)}-${formatCurrency(item.suggestedResaleRange.high)}`;

  if (item.status === "sold") {
    return {
      title: `${toTitleCase(item.itemName)} already found a new home`,
      preview: `${itemLabel} already completed its reuse loop and proved it still had more life to give.`,
      detail: `${itemLabel} moved from donation to resale and found someone ready to bring it home again. That closed loop is exactly what makes the journey worth showing.`,
      buyMessage: "This piece is already spoken for, but its story still shows the reuse loop working.",
      pickupMessage: "This piece has already been picked up, but its completed journey still tells the story.",
      steps: [
        {
          label: "Passed forward",
          detail: `Someone chose to donate this ${item.itemName.toLowerCase()} instead of letting it go unused.`
        },
        {
          label: "Checked in",
          detail: "DonateSmart logged it, photographed it, and prepared it for resale."
        },
        {
          label: "Priced with care",
          detail: `Staff gave it a thrift-friendly range around ${rangeLabel} based on its condition.`
        },
        {
          label: "Taken home",
          detail: item.soldPrice
            ? `It eventually sold for ${formatCurrency(item.soldPrice)} and started a fresh chapter.`
            : "It eventually found a buyer and started a fresh chapter."
        }
      ],
      generatedAt: new Date().toISOString(),
      model: "fallback-local"
    };
  }

  if (["approved", "ready-for-floor"].includes(item.status)) {
    return {
      title: `${toTitleCase(item.itemName)} is ready for its next chapter`,
      preview: `${itemLabel} is ready to leave the rack, shelf, or floor and become useful to someone new.`,
      detail: `${itemLabel} already helped one person make space and is now prepared to be chosen again. ${item.donorImpactMessage}`,
      buyMessage: `Buy now keeps the story moving and lands this piece within its ${rangeLabel} resale range.`,
      pickupMessage: "Choose a quick pickup window and this item can be held for a gentle handoff.",
      steps: [
        {
          label: "Passed forward",
          detail: `A donor decided this ${item.itemName.toLowerCase()} still had plenty left to offer.`
        },
        {
          label: "Checked in",
          detail: "DonateSmart photographed it, tagged it, and brought it into the resale flow."
        },
        {
          label: "Priced with care",
          detail: `Its ${item.condition} condition supports a thoughtful range around ${rangeLabel}.`
        },
        {
          label: "Waiting for a match",
          detail: "The next buyer gets to turn this saved item into a lived-with piece again."
        }
      ],
      generatedAt: new Date().toISOString(),
      model: "fallback-local"
    };
  }

  return {
    title: `${toTitleCase(item.itemName)} is getting ready for its next home`,
    preview: `${itemLabel} is still moving through intake, but its next chapter is already starting to take shape.`,
    detail: `${itemLabel} has been passed forward and is now being prepared for the floor. ${item.donorImpactMessage}`,
    buyMessage: "Buying opens once staff marks this piece ready for the floor.",
    pickupMessage: "Schedule a pickup request early and come back once the item is ready.",
    steps: [
      {
        label: "Passed forward",
        detail: `A donor chose to let this ${item.itemName.toLowerCase()} keep being useful.`
      },
      {
        label: "Checked in",
        detail: "DonateSmart created a record, photo, and trackable story for it."
      },
      {
        label: "Being prepared",
        detail: "Staff is still reviewing and pricing this piece before it reaches the floor."
      },
      {
        label: "Next home ahead",
        detail: "Once it clears intake, a buyer can step into the story too."
      }
    ],
    generatedAt: new Date().toISOString(),
    model: "fallback-local"
  };
}

export function getBuyerStory(item: DonationItem, _mode?: "buy" | "pickup") {
  return item.buyerStory ?? buildFallbackBuyerStory(item);
}

export function getBuyerJourneySteps(item: DonationItem, mode?: "buy" | "pickup"): JourneyStep[] {
  const story = getBuyerStory(item);
  const isFloorReady = ["approved", "ready-for-floor", "sold"].includes(item.status);
  const isSold = item.status === "sold";
  const steps = story.steps.slice(0, 4);

  while (steps.length < 4) {
    const fallbackSteps = buildFallbackBuyerStory(item).steps;
    steps.push(fallbackSteps[steps.length]);
  }

  return steps.map((step, index) => {
    if (index === 2) {
      return {
        label: step.label,
        detail: step.detail,
        complete: isFloorReady,
        active: !isFloorReady
      };
    }

    if (index === 3) {
      if (isSold) {
        return {
          label: step.label || "Taken home",
          detail: item.soldPrice
            ? `This piece completed its journey with a sale at ${formatCurrency(item.soldPrice)}.`
            : step.detail,
          complete: true
        };
      }

      if (mode === "buy") {
        return {
          label: "Chosen by buyer",
          detail: story.buyMessage,
          complete: false,
          active: true
        };
      }

      if (mode === "pickup") {
        return {
          label: "Pickup being planned",
          detail: story.pickupMessage,
          complete: false,
          active: true
        };
      }

      return {
        label: step.label,
        detail: step.detail,
        complete: false,
        active: true
      };
    }

    return {
      label: step.label,
      detail: step.detail,
      complete: true
    };
  });
}

export function getBuyerStoryClosing(item: DonationItem) {
  if (item.status === "sold") {
    return item.soldPrice
      ? `It eventually sold for ${formatCurrency(item.soldPrice)}, turning generosity into real reuse.`
      : "It eventually found someone who wanted it enough to bring it home.";
  }

  return item.donorImpactMessage;
}
