import { NextResponse } from "next/server";
import { createDonationItem, createOrUpdateDonor, getAllItems } from "@/lib/storage";
import { validateDonationInput, validateDonorInputWithOptions } from "@/lib/validation";
import { DonationInput, DonorInput } from "@/lib/types";
import { DonationReviewError } from "@/lib/gemini";

export async function GET() {
  const items = await getAllItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<
      DonationInput & { donor: DonorInput; donorId?: string; isAnonymous?: boolean }
    >;
    const validation = validateDonationInput(payload);
    const isAnonymous = Boolean(payload.isAnonymous);
    const donorValidation = validateDonorInputWithOptions(payload.donor || {}, { allowAnonymous: isAnonymous });

    if (!validation.valid || !donorValidation.valid) {
      return NextResponse.json(
        {
          error: "Please correct the highlighted fields.",
          errors: {
            ...donorValidation.errors,
            ...validation.errors
          }
        },
        { status: 400 }
      );
    }

    const donor = isAnonymous ? null : await createOrUpdateDonor(payload.donor!, payload.donorId);

    const item = await createDonationItem({
      itemName: payload.itemName!.trim(),
      category: payload.category!,
      isBulkClothing: Boolean(payload.isBulkClothing),
      bulkClothingRange: payload.bulkClothingRange || "",
      condition: payload.condition!,
      brand: payload.brand?.trim() || "",
      size: payload.size?.trim() || "",
      description: payload.description?.trim() || "",
      imageDataUrl: payload.imageDataUrl!
    }, donor, { isAnonymousDonation: isAnonymous });

    return NextResponse.json({ id: item.id, item, donorId: donor?.id ?? null }, { status: 201 });
  } catch (error) {
    if (error instanceof DonationReviewError) {
      return NextResponse.json(
        {
          error: error.message,
          errors: error.fieldErrors
        },
        { status: 422 }
      );
    }

    console.error("Unable to create donation item:", error);

    return NextResponse.json(
      { error: "The donation could not be created right now." },
      { status: 500 }
    );
  }
}
