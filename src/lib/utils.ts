import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (num >= 10000000) return numberToWords(Math.floor(num / 10000000)) + " Crore " + numberToWords(num % 10000000);
  if (num >= 100000) return numberToWords(Math.floor(num / 100000)) + " Lakh " + numberToWords(num % 100000);
  if (num >= 1000) return numberToWords(Math.floor(num / 1000)) + " Thousand " + numberToWords(num % 1000);
  if (num >= 100) return numberToWords(Math.floor(num / 100)) + " Hundred " + numberToWords(num % 100);
  if (num >= 20) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  return ones[num];
}

export function amountInWords(num: number): string {
  return numberToWords(Math.round(num)).replace(/\s+/g, " ").trim();
}
