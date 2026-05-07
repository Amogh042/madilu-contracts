export const PG_ADDRESSES: Record<string, string> = {
  "Aarna": "Aarna PG, Kumaraswamy Layout, Bangalore - 560078",
  "Aishwarya": "Aishwarya PG, Kumaraswamy Layout, Bangalore - 560078",
  "Ambara": "Ambara PG, Kumaraswamy Layout, Bangalore - 560078",
  "Beeshma": "Beeshma PG, Kumaraswamy Layout, Bangalore - 560078",
  "Drona": "Drona PG, Kumaraswamy Layout, Bangalore - 560078",
  "Eeshan": "Eeshan PG, Kumaraswamy Layout, Bangalore - 560078",
  "Elite": "Elite PG, Kumaraswamy Layout, Bangalore - 560078",
  "Madilu Rajlee": "Madilu Rajlee PG, Kumaraswamy Layout, Bangalore - 560078",
  "Madilu Siri": "Madilu Siri PG, Kumaraswamy Layout, Bangalore - 560078",
};

export const PG_LIST = Object.keys(PG_ADDRESSES);

export const GOOGLE_SHEET_CSV_URL = "PASTE_YOUR_CSV_URL_HERE";

export type Student = {
  name: string;
  phone: string;
  email: string;
  pg: string;
  permanentAddress: string;
  parentName: string;
  parentAddress: string;
  parentPhone: string;
  parentEmail: string;
  paymentMode: string;
};

export type AgreementData = {
  student: Student;
  ownerName: string;
  ownerContact: string;
  pgName: string;
  pgAddress: string;
  roomNumber: string;
  monthlyRent: number;
  paymentMode: "Monthly" | "Annual 1 Instalment" | "Annual 2 Instalments";
  startDate: string;
  endDate: string;
  securityDeposit: number;
  maintenanceCharges: number;
};

export type StoredAgreement = {
  id: string;
  createdAt: string;
  data: AgreementData;
};
