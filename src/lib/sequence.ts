import { connectToDatabase } from "./db";
import { CounterModel } from "@/models/Counter";
import { SettingsModel } from "@/models/Settings";

export async function getNextEnquiryNumber(): Promise<string> {
  await connectToDatabase();
  const year = new Date().getFullYear();
  
  // Fetch configured prefix from settings or default to "ENQ"
  let prefix = "ENQ";
  try {
    const settings = await SettingsModel.findOne();
    if (settings && settings.enquiryPrefix) {
      prefix = settings.enquiryPrefix;
    }
  } catch {
    // default
  }

  const counterKey = `enquiry-${year}`;
  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const formattedSeq = String(counter.seq).padStart(4, "0");
  return `${prefix}-${year}-${formattedSeq}`;
}

export async function getNextQuotationNumber(): Promise<string> {
  await connectToDatabase();
  const year = new Date().getFullYear();

  let prefix = "QT";
  try {
    const settings = await SettingsModel.findOne();
    if (settings && settings.quotationPrefix) {
      prefix = settings.quotationPrefix;
    }
  } catch {
    // default
  }

  const counterKey = `quotation-${year}`;
  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const formattedSeq = String(counter.seq).padStart(4, "0");
  return `${prefix}-${year}-${formattedSeq}`;
}
